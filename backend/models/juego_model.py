from extensions import db
from datetime import datetime

class JuegoTerapeutico(db.Model):
    __tablename__ = 'juegos_terapeuticos'
    
    id = db.Column('id_juego', db.Integer, primary_key=True)  # Mapear id a id_juego en DB
    nombre = db.Column(db.String(100), nullable=False)
    tipo_juego = db.Column(db.String(20), nullable=False)
    descripcion = db.Column(db.Text)
    objetivo_emocional = db.Column(db.String(20))
    duracion_recomendada = db.Column(db.Integer)  # en minutos
    icono = db.Column(db.String(10))
    activo = db.Column(db.Boolean, default=True)
    
    # Relación con sesiones
    sesiones = db.relationship('SesionJuego', backref='juego', lazy=True)
    
    def to_dict(self):
        return {
            'id_juego': self.id,
            'id': self.id,
            'nombre': self.nombre,
            'tipo_juego': self.tipo_juego,
            'descripcion': self.descripcion,
            'objetivo_emocional': self.objetivo_emocional,
            'duracion_recomendada': self.duracion_recomendada,
            'icono': self.icono,
            'activo': self.activo
        }


class SesionJuego(db.Model):
    __tablename__ = 'sesiones_juego'
    
    id = db.Column(db.Integer, primary_key=True)
    # `usuario` table is managed by raw SQL helper functions (not a SQLAlchemy model).
    # Avoid DB-level ForeignKey here to prevent SQLAlchemy metadata errors when
    # the `usuario` table is not declared as a SQLAlchemy model.
    id_usuario = db.Column(db.Integer, nullable=False)
    id_juego = db.Column(db.Integer, db.ForeignKey('juegos_terapeuticos.id_juego'), nullable=False)
    
    fecha_inicio = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_fin = db.Column(db.DateTime)
    duracion_segundos = db.Column(db.Integer)
    
    # Resultados
    puntuacion = db.Column(db.Integer, default=0)
    nivel_alcanzado = db.Column(db.Integer, default=1)
    completado = db.Column(db.Boolean, default=False)
    
    # Estado emocional
    estado_antes = db.Column(db.String(20))
    estado_despues = db.Column(db.String(20))
    mejora_percibida = db.Column(db.String(20))
    
    notas = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'id_usuario': self.id_usuario,
            'id_juego': self.id_juego,
            'juego_nombre': self.juego.nombre if self.juego else None,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'duracion_segundos': self.duracion_segundos,
            'puntuacion': self.puntuacion,
            'nivel_alcanzado': self.nivel_alcanzado,
            'completado': self.completado,
            'estado_antes': self.estado_antes,
            'estado_despues': self.estado_despues,
            'mejora_percibida': self.mejora_percibida,
            'notas': self.notas
        }
