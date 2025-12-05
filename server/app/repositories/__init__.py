# Repositories - Data access layer
from .data_store import DataStore

# 싱글톤 인스턴스
data_store = DataStore()

__all__ = ["data_store", "DataStore"]

