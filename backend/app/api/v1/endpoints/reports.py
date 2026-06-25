from urllib.parse import quote

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_doctor_or_admin
from app.models.user import User
from app.services.pdf_report_service import PDFReportService
from app.services.prediction_history_service import PredictionHistoryService

router = APIRouter()


@router.get(
    "/predictions/{prediction_id}/pdf",
    summary="Export prediction PDF report",
)
def export_prediction_pdf(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin),
) -> StreamingResponse:
    prediction = PredictionHistoryService(db).get_prediction(prediction_id, current_user)
    pdf_service = PDFReportService()
    pdf_bytes = pdf_service.build_prediction_report(prediction)
    filename = pdf_service.build_filename(prediction)

    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}",
    }
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers=headers,
    )
