# Routers - API endpoints (Controllers)
from .auth import router as auth_router
from .match import router as match_router
from .rooms import router as rooms_router
from .users import router as users_router
from .restaurants import router as restaurants_router
from .stats import router as stats_router

__all__ = [
    "auth_router",
    "match_router",
    "rooms_router",
    "users_router",
    "restaurants_router",
    "stats_router",
]

