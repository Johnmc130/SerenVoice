"""
Corrección MASIVA de nombres de columnas en el backend
Corrige todas las referencias a columnas que no existen
"""
import os

# Mapeo de correcciones necesarias
FIXES = {
    # Archivo: [(búsqueda, reemplazo, descripción)]
    'backend/models/sesion.py': [
        ('activo = 1', 'activa = 1', 'Columna sesion.activo → sesion.activa'),
        ('AND activo =', 'AND activa =', 'Columna sesion.activo → sesion.activa'),
    ],
    
    'backend/routes/juegos_routes.py': [
        ('duracion_recomendada', 'duracion_estimada', 'Columna inexistente → duracion_estimada'),
        ('objetivo_emocional', 'emociones_objetivo', 'Columna inexistente → emociones_objetivo'),
    ],
    
    'backend/models/juego_terapeutico.py': [
        ('objetivo_emocional', 'emociones_objetivo', 'Columna inexistente → emociones_objetivo'),
    ],
}

def apply_fixes():
    print("\n" + "="*70)
    print("🔧 CORRECCIÓN MASIVA DE COLUMNAS EN BACKEND")
    print("="*70 + "\n")
    
    fixed_count = 0
    
    for file_path, fixes in FIXES.items():
        full_path = f"C:\\Users\\kenny\\Downloads\\Proyecto-Final---SerenVoice-main\\{file_path.replace('/', chr(92))}"
        
        if not os.path.exists(full_path):
            print(f"⚠️ Archivo no encontrado: {file_path}")
            continue
        
        print(f"\n📝 Procesando: {file_path}")
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        for search, replace, desc in fixes:
            count = content.count(search)
            if count > 0:
                content = content.replace(search, replace)
                print(f"  ✅ {desc} ({count} ocurrencias)")
                fixed_count += count
            else:
                print(f"  ⏭️ {desc} (ya corregido)")
        
        if content != original_content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  💾 Archivo actualizado")
        else:
            print(f"  ⏭️ Sin cambios necesarios")
    
    print("\n" + "="*70)
    print(f"✅ CORRECCIÓN COMPLETADA: {fixed_count} correcciones aplicadas")
    print("="*70)
    
    print("\n🚀 PRÓXIMO PASO:")
    print("1. Copiar archivos corregidos a Cloud Run:")
    print("   gcloud run deploy serenvoice-backend --source backend --region us-central1")
    print("\n2. O reiniciar Cloud Run si los archivos se actualizan automáticamente")

if __name__ == '__main__':
    apply_fixes()
