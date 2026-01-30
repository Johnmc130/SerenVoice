#!/usr/bin/env python3
"""
Script para corregir el stored procedure sp_aceptar_invitacion.
El problema: cuando un usuario que fue miembro antes intenta unirse de nuevo,
el INSERT falla por duplicate key porque existe un registro inactivo.

Solución: Usar INSERT ... ON DUPLICATE KEY UPDATE para reactivar el miembro.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import DatabaseConnection


def fix_sp_aceptar_invitacion():
    """Recrea el stored procedure con lógica para reactivar miembros inactivos"""
    
    if DatabaseConnection.pool is None:
        DatabaseConnection.initialize_pool()
    
    conn = None
    cursor = None
    
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor()
        
        # 1. Eliminar el stored procedure existente
        print("Eliminando stored procedure anterior...")
        cursor.execute("DROP PROCEDURE IF EXISTS sp_aceptar_invitacion")
        conn.commit()
        
        # 2. Crear el nuevo stored procedure
        print("Creando nuevo stored procedure...")
        
        new_sp = """
        CREATE PROCEDURE sp_aceptar_invitacion(
            IN p_id_invitacion INT, 
            IN p_id_usuario INT
        )
        BEGIN
            DECLARE v_id_grupo INT;
            DECLARE v_rol VARCHAR(50);
            DECLARE v_estado VARCHAR(20);
            DECLARE v_existe_miembro INT DEFAULT 0;
            
            -- Obtener datos de la invitación
            SELECT id_grupo, rol_propuesto, estado 
            INTO v_id_grupo, v_rol, v_estado
            FROM invitaciones_grupo 
            WHERE id_invitacion = p_id_invitacion 
              AND id_usuario_invitado = p_id_usuario;
            
            -- Verificar que la invitación existe y está pendiente
            IF v_estado IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invitación no encontrada';
            ELSEIF v_estado != 'pendiente' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La invitación ya fue respondida';
            END IF;
            
            -- Verificar si ya es miembro ACTIVO
            IF EXISTS (
                SELECT 1 FROM grupo_miembros 
                WHERE id_grupo = v_id_grupo 
                  AND id_usuario = p_id_usuario 
                  AND activo = 1 
                  AND estado = 'activo'
            ) THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ya eres miembro activo de este grupo';
            END IF;
            
            -- Verificar si existe un registro inactivo (miembro anterior)
            SELECT COUNT(*) INTO v_existe_miembro
            FROM grupo_miembros 
            WHERE id_grupo = v_id_grupo AND id_usuario = p_id_usuario;
            
            IF v_existe_miembro > 0 THEN
                -- Reactivar el miembro existente
                UPDATE grupo_miembros 
                SET activo = 1, 
                    estado = 'activo', 
                    rol_grupo = v_rol,
                    fecha_ingreso = NOW(),
                    fecha_salida = NULL
                WHERE id_grupo = v_id_grupo AND id_usuario = p_id_usuario;
            ELSE
                -- Insertar nuevo miembro
                INSERT INTO grupo_miembros (id_grupo, id_usuario, rol_grupo, activo, estado, fecha_ingreso)
                VALUES (v_id_grupo, p_id_usuario, v_rol, 1, 'activo', NOW());
            END IF;
            
            -- Actualizar estado de la invitación
            UPDATE invitaciones_grupo 
            SET estado = 'aceptada', fecha_respuesta = NOW()
            WHERE id_invitacion = p_id_invitacion;
            
            SELECT 'Invitación aceptada exitosamente' AS mensaje, v_id_grupo AS id_grupo;
            
        END
        """
        
        cursor.execute(new_sp)
        conn.commit()
        
        print("✅ Stored procedure sp_aceptar_invitacion actualizado correctamente")
        print("\nEl procedimiento ahora:")
        print("  - Verifica si el usuario ya es miembro activo")
        print("  - Si existe un registro inactivo (ex-miembro), lo reactiva")
        print("  - Si no existe registro, crea uno nuevo")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            DatabaseConnection.release_connection(conn)


def main():
    print("=" * 60)
    print("  CORRIGIENDO STORED PROCEDURE sp_aceptar_invitacion")
    print("=" * 60)
    print()
    
    success = fix_sp_aceptar_invitacion()
    
    print()
    print("=" * 60)
    if success:
        print("  ✅ PROCESO COMPLETADO")
        print("=" * 60)
        print("\nAhora puedes aceptar invitaciones incluso si")
        print("el usuario fue miembro del grupo anteriormente.")
    else:
        print("  ❌ PROCESO FALLIDO")
        print("=" * 60)


if __name__ == '__main__':
    main()
