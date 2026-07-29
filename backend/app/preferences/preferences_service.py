from app.database.database import SessionLocal
from sqlalchemy import text
from app.preferences.DTO import UserPreference


def getPreferences(user_id:int):
    db = SessionLocal()
    
    query = text("""
        SELECT 
        id, 
        user_id, 
        preference_name, 
        preference_value, 
        enabled, 
        created_at, 
        updated_at
    FROM user_preferences
    WHERE user_id = :user_id
    ORDER BY created_at DESC;
""")

    result = db.execute(query, {"user_id": user_id}).mappings().all()
    db.close()
    return result

def add_preference(user_id: int, preference: UserPreference):
    db = SessionLocal()

    try:
        query = text("""
            INSERT INTO user_preferences
            (
                user_id,
                preference_name,
                preference_value,
                enabled
            )
            VALUES
            (
                :user_id,
                :preference_name,
                :preference_value,
                :enabled
            )
        """)

        result = db.execute(query, {
            "user_id": user_id,
            "preference_name": preference.preference_name,
            "preference_value": str(preference.preference_value),
            "enabled": preference.enabled,
        })

        db.commit()

        return {
            "id": result.lastrowid,
            "message": "Preference added successfully."
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

def update_preference(preference_id: int, user_id: int, preference: UserPreference):
    db = SessionLocal()

    try:
        query = text("""
            UPDATE user_preferences
            SET
                preference_name = :preference_name,
                preference_value = :preference_value,
                enabled = :enabled
            WHERE id = :preference_id AND user_id = :user_id
        """)

        result = db.execute(query, {
            "preference_id": preference_id,
            "user_id": user_id,
            "preference_name": preference.preference_name,
            "preference_value": str(preference.preference_value),
            "enabled": preference.enabled,
        })

        # Check if any row was actually updated
        if result.rowcount == 0:
            db.rollback()
            return {
                "success": False,
                "message": "Preference not found or not owned by user."
            }

        db.commit()

        return {
            "id": preference_id,
            "success": True,
            "message": "Preference updated successfully."
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()



def toggle_preference_status(preference_id: int, user_id: int, enabled: bool):
    db = SessionLocal()

    try:
        query = text("""
            UPDATE user_preferences
            SET enabled = :enabled
            WHERE id = :preference_id AND user_id = :user_id
        """)

        result = db.execute(query, {
            "preference_id": preference_id,
            "user_id": user_id,
            "enabled": enabled,
        })

        # Ensure the record exists and belongs to the requesting user
        if result.rowcount == 0:
            db.rollback()
            return {
                "success": False,
                "message": "Preference not found or access denied."
            }

        db.commit()

        return {
            "id": preference_id,
            "enabled": enabled,
            "success": True,
            "message": "Preference status updated successfully."
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()



def delete_preference(preference_id: int, user_id: int):
    db = SessionLocal()

    try:
        query = text("""
            DELETE FROM user_preferences
            WHERE id = :preference_id AND user_id = :user_id
        """)

        result = db.execute(query, {
            "preference_id": preference_id,
            "user_id": user_id,
        })

        # Ensure the record existed and was deleted
        if result.rowcount == 0:
            db.rollback()
            return {
                "success": False,
                "message": "Preference not found or access denied."
            }

        db.commit()

        return {
            "id": preference_id,
            "success": True,
            "message": "Preference deleted successfully."
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()