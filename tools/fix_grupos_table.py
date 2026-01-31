#!/usr/bin/env python3
"""
Script para arreglar la estructura de la tabla grupos en Railway
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv('.env')

def main():
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        port=int(os.getenv('DB_PORT'))
    )
    c = conn.cursor()
    
    print("=" * 50)
    print("ARREGLANDO TABLA GRUPOS")
    print("=" * 50)
    
    # Verificar columnas existentes
    c.execute('DESCRIBE grupos')
    existing_cols = [col[0] for col in c.fetchall()]
    print(f"Columnas existentes: {existing_cols}")
    
    # Alteraciones necesarias
    alteraciones = [
        ("id_facilitador", "ALTER TABLE grupos ADD COLUMN id_facilitador INT DEFAULT NULL AFTER id_creador"),
        ("codigo_acceso", "ALTER TABLE grupos ADD COLUMN codigo_acceso VARCHAR(20) DEFAULT NULL AFTER codigo_invitacion"),
        ("tipo_grupo", "ALTER TABLE grupos ADD COLUMN tipo_grupo VARCHAR(50) DEFAULT 'apoyo'"),
        ("privacidad", "ALTER TABLE grupos ADD COLUMN privacidad VARCHAR(20) DEFAULT 'privado'"),
        ("max_participantes", "ALTER TABLE grupos ADD COLUMN max_participantes INT DEFAULT NULL"),
    ]
    
    for col_name, sql in alteraciones:
        if col_name not in existing_cols:
            try:
                c.execute(sql)
                conn.commit()
                print(f"✅ Columna {col_name} agregada")
            except Exception as e:
                print(f"⚠️ {col_name}: {e}")
        else:
            print(f"✓ {col_name} ya existe")
    
    # Sincronizar datos
    print("\nSincronizando datos...")
    updates = [
        ("id_facilitador", "UPDATE grupos SET id_facilitador = id_creador WHERE id_facilitador IS NULL"),
        ("codigo_acceso", "UPDATE grupos SET codigo_acceso = codigo_invitacion WHERE codigo_acceso IS NULL"),
        ("privacidad", "UPDATE grupos SET privacidad = CASE WHEN es_privado = 1 THEN 'privado' ELSE 'publico' END"),
        ("max_participantes", "UPDATE grupos SET max_participantes = max_miembros WHERE max_participantes IS NULL"),
    ]
    
    for field, sql in updates:
        try:
            c.execute(sql)
            conn.commit()
            print(f"✅ {field} sincronizado ({c.rowcount} filas)")
        except Exception as e:
            print(f"⚠️ Error en {field}: {e}")
    
    # Verificar estructura final
    print("\n" + "=" * 50)
    print("ESTRUCTURA FINAL DE GRUPOS:")
    c.execute('DESCRIBE grupos')
    for col in c.fetchall():
        print(f"  {col[0]:25} {col[1]}")
    
    c.close()
    conn.close()
    print("\n✅ Tabla grupos actualizada correctamente!")

if __name__ == "__main__":
    main()
