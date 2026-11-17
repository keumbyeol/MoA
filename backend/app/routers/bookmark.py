from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.bookmark import Bookmark
from app.routers.guide import all_cards, category_ids_for

router = APIRouter(prefix="/api/bookmarks", tags=["북마크"])


class BookmarkRequest(BaseModel):
    guide_id: str = Field(min_length=1, max_length=200)


def valid_cards(db: Session):
    return {card["id"]: card for card in all_cards(db, category_ids_for(db))}


def bookmark_dict(item: Bookmark, cards: dict):
    return {"id": item.id, "guide_id": item.guide_key, "guide": cards.get(item.guide_key), "created_at": item.created_at}


@router.get("")
def list_bookmarks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.scalars(select(Bookmark).where(Bookmark.user_id == user.id).order_by(Bookmark.created_at.desc(), Bookmark.id.desc())).all()
    cards = valid_cards(db)
    return {"total": len(items), "items": [bookmark_dict(item, cards) for item in items]}


@router.get("/count")
def count_bookmarks(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    count = db.scalar(select(func.count(Bookmark.id)).where(Bookmark.user_id == user.id)) or 0
    return {"count": count}


@router.get("/ids")
def bookmark_ids(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ids = db.scalars(select(Bookmark.guide_key).where(Bookmark.user_id == user.id)).all()
    return {"guide_ids": list(ids)}


@router.post("", status_code=status.HTTP_201_CREATED)
def add_bookmark(payload: BookmarkRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    guide_id = payload.guide_id.strip()
    cards = valid_cards(db)
    if guide_id not in cards:
        raise HTTPException(status_code=404, detail="해당 금융정보를 찾을 수 없습니다.")
    existing = db.scalar(select(Bookmark).where(Bookmark.user_id == user.id, Bookmark.guide_key == guide_id))
    if existing:
        return bookmark_dict(existing, cards)
    item = Bookmark(user_id=user.id, guide_key=guide_id)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        item = db.scalar(select(Bookmark).where(Bookmark.user_id == user.id, Bookmark.guide_key == guide_id))
        if item is None:
            raise
    else:
        db.refresh(item)
    return bookmark_dict(item, cards)


@router.delete("/{guide_id:path}")
def remove_bookmark(guide_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.scalar(select(Bookmark).where(Bookmark.user_id == user.id, Bookmark.guide_key == guide_id))
    if item is None:
        raise HTTPException(status_code=404, detail="저장된 북마크가 없습니다.")
    db.delete(item)
    db.commit()
    return {"message": "북마크가 해제되었습니다."}
