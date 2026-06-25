from collections.abc import Awaitable, Callable

from fastapi import Request, Response


async def audit_context_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request.state.ip_address = _extract_client_ip(request)
    return await call_next(request)


def _extract_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client is None:
        return None

    return request.client.host
