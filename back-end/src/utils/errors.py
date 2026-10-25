"""Exception aplikasi supaya service/validasi cukup `raise AppError(...)`."""


class AppError(Exception):
    def __init__(self, message, status_code=400, code=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
