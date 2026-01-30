# backend/utils/helpers.py
from flask import jsonify

class Helpers:
    """Funciones utilitarias generales"""

    @staticmethod
    def format_response(success=True, data=None, message="", status=200):
        """
        Estándar de respuesta API
        """
        response = {
            "success": success,
            "message": message
        }

        if data is not None:
            response["data"] = data

        return jsonify(response), status

    @staticmethod
    def paginate_results(items, page=1, per_page=20):
        """
        Pagina una lista de items
        """
        if not isinstance(items, list):
            items = list(items)
        
        total = len(items)
        start = (page - 1) * per_page
        end = start + per_page
        
        return {
            "items": items[start:end],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
