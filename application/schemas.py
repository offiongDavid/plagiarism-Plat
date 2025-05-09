from pydantic import BaseModel

class file_type(BaseModel):
    file_name: str
    category: str
    