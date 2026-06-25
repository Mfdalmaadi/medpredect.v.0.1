from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.patient import Patient
from app.models.prediction import Prediction


class PDFReportService:
    def build_prediction_report(self, prediction: Prediction) -> bytes:
        buffer = BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
            title="MedPredict AI Prediction Report",
        )

        styles = getSampleStyleSheet()
        title_style = styles["Title"]
        heading_style = styles["Heading2"]
        normal_style = styles["BodyText"]
        note_style = ParagraphStyle(
            "MedicalDisclaimer",
            parent=normal_style,
            textColor=colors.HexColor("#555555"),
            fontSize=9,
            leading=12,
        )

        story = [
            Paragraph("MedPredict AI - Prediction Report", title_style),
            Spacer(1, 0.4 * cm),
            Paragraph(
                "This report is generated for clinical decision support only. It does not replace medical judgment.",
                note_style,
            ),
            Spacer(1, 0.6 * cm),
        ]

        story.extend(self._patient_section(prediction.patient, heading_style))
        story.extend(self._prediction_section(prediction, heading_style))
        story.extend(self._clinical_input_section(prediction, heading_style))
        story.extend(self._shap_section(prediction, heading_style))
        story.extend(self._recommendation_section(prediction, heading_style))

        document.build(story)
        return buffer.getvalue()

    def build_filename(self, prediction: Prediction) -> str:
        patient = prediction.patient
        safe_name = f"{patient.last_name}_{patient.first_name}".replace(" ", "_")
        report_date = prediction.created_at.strftime("%Y%m%d") if prediction.created_at else "report"
        return f"MedPredict_{safe_name}_{prediction.disease_type.value}_{report_date}.pdf"

    def _patient_section(self, patient: Patient, heading_style):
        rows = [
            ["Patient ID", patient.id],
            ["Medical Identifier", patient.medical_identifier],
            ["Full Name", f"{patient.first_name} {patient.last_name}"],
            ["Date of Birth", patient.date_of_birth.isoformat()],
            ["Gender", patient.gender.value],
            ["Phone", patient.phone or "Not provided"],
        ]
        return [
            Paragraph("Patient Information", heading_style),
            self._key_value_table(rows),
            Spacer(1, 0.5 * cm),
        ]

    def _prediction_section(self, prediction: Prediction, heading_style):
        rows = [
            ["Prediction ID", prediction.id],
            ["Disease", prediction.disease_type.value],
            ["Probability", f"{prediction.probability:.2%}"],
            ["Risk Level", prediction.risk_level.value.upper()],
            ["Created At", prediction.created_at.strftime("%Y-%m-%d %H:%M:%S")],
        ]
        return [
            Paragraph("Prediction Result", heading_style),
            self._key_value_table(rows),
            Spacer(1, 0.5 * cm),
        ]

    def _clinical_input_section(self, prediction: Prediction, heading_style):
        if prediction.diabetes_input is not None:
            clinical_input = prediction.diabetes_input
            rows = [
                ["Pregnancies", clinical_input.pregnancies],
                ["Glucose", clinical_input.glucose],
                ["Blood Pressure", clinical_input.blood_pressure],
                ["Skin Thickness", clinical_input.skin_thickness],
                ["Insulin", clinical_input.insulin],
                ["BMI", clinical_input.bmi],
                ["Diabetes Pedigree Function", clinical_input.diabetes_pedigree_function],
                ["Age", clinical_input.age],
            ]
        elif prediction.pcos_input is not None:
            clinical_input = prediction.pcos_input
            rows = [
                ["Age", clinical_input.age],
                ["BMI", clinical_input.bmi],
                ["Cycle Regularity", clinical_input.cycle_regularity],
                ["Acne", clinical_input.acne],
                ["Hair Loss", clinical_input.hair_loss],
                ["Hirsutism", clinical_input.hirsutism],
                ["Insulin Resistance", clinical_input.insulin_resistance],
                ["LH/FSH Ratio", clinical_input.lh_fsh_ratio],
                ["Follicle Size", clinical_input.follicle_size],
            ]
        else:
            rows = [["Clinical Input", "No clinical input stored."]]

        return [
            Paragraph("Clinical Input", heading_style),
            self._key_value_table(rows),
            Spacer(1, 0.5 * cm),
        ]

    def _shap_section(self, prediction: Prediction, heading_style):
        rows = [["Feature", "Input Value", "SHAP Value", "Impact", "Direction"]]
        for shap_value in sorted(prediction.shap_values, key=lambda item: item.absolute_impact, reverse=True):
            rows.append(
                [
                    shap_value.feature_name,
                    f"{shap_value.input_value:.4g}",
                    f"{shap_value.shap_value:.4f}",
                    f"{shap_value.absolute_impact:.4f}",
                    shap_value.direction,
                ]
            )

        if len(rows) == 1:
            rows.append(["No SHAP values stored.", "", "", "", ""])

        return [
            Paragraph("SHAP Summary", heading_style),
            self._table(rows),
            Spacer(1, 0.5 * cm),
        ]

    def _recommendation_section(self, prediction: Prediction, heading_style):
        rows = [["Category", "Recommendation"]]
        for recommendation in prediction.recommendations:
            rows.append([recommendation.category.value, recommendation.description])

        if len(rows) == 1:
            rows.append(["None", "No recommendations stored."])

        return [
            Paragraph("Recommendations", heading_style),
            self._table(rows, column_widths=[4 * cm, 11 * cm]),
            Spacer(1, 0.5 * cm),
        ]

    def _key_value_table(self, rows):
        return self._table(rows, column_widths=[5 * cm, 10 * cm])

    def _table(self, rows, column_widths=None):
        table = Table(rows, colWidths=column_widths, hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF2F8")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1B4F72")),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D5D8DC")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        return table
