from databases import Database
from sqlalchemy import create_engine, MetaData

DATABASE_URL = "mysql+pymysql://root:Swaggerlis@12@localhost:3306/auth_system"

database = Database(DATABASE_URL)
metadata = MetaData()
