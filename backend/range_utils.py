import os
from fastapi import Request
from starlette.responses import FileResponse, StreamingResponse

def range_requests_response(request: Request, file_path: str, content_type: str):
    """Returns StreamingResponse using Range Requests of a given file"""
    file_size = os.stat(file_path).st_size
    range_header = request.headers.get("range")

    headers = {
        "content-type": content_type or "application/octet-stream",
        "accept-ranges": "bytes",
        "content-encoding": "identity",
        "access-control-expose-headers": "content-type, accept-ranges, content-length, content-range, content-encoding"
    }

    if range_header:
        try:
            from_bytes, until_bytes = range_header.replace("bytes=", "").split("-")
            from_bytes = int(from_bytes)
            until_bytes = int(until_bytes) if until_bytes else file_size - 1
        except ValueError:
            # Fallback for invalid range
            return FileResponse(file_path, headers=headers)
        
        if from_bytes >= file_size:
             # Range not satisfiable
             return StreamingResponse(iter([]), status_code=416, headers=headers)

        chunk_size = until_bytes - from_bytes + 1
        
        def iterfile():
            with open(file_path, "rb") as f:
                f.seek(from_bytes)
                # Stream in chunks to avoid memory overload for large ranges
                read_size = 0
                while read_size < chunk_size:
                    req_size = min(1024 * 64, chunk_size - read_size)
                    data = f.read(req_size)
                    if not data:
                        break
                    yield data
                    read_size += len(data)
        
        headers["content-range"] = f"bytes {from_bytes}-{until_bytes}/{file_size}"
        headers["content-length"] = str(chunk_size)
        
        return StreamingResponse(
            iterfile(),
            status_code=206,
            headers=headers,
            media_type=content_type
        )
    
    return FileResponse(file_path, headers=headers)
