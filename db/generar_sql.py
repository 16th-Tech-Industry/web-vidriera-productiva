import os
import pandas as pd

# Obtener la carpeta absoluta donde está ubicado este archivo .py
DIR_BASE = os.path.dirname(os.path.abspath(__file__))

excel_path = os.path.join(DIR_BASE, 'Dptos_Loc.xlsx')
output_sql = os.path.join(DIR_BASE, 'insert_geografia.sql')

# Leer datos desde el Excel
df = pd.read_excel(excel_path, sheet_name='Hoja1')

with open(output_sql, 'w', encoding='utf-8') as f:
    # 1. ZONAS
    f.write("-- 1. INSERTAR ZONAS\n")
    for z in range(1, 8):
        f.write(
            f"INSERT INTO zonas (id_zona, nombre_zona) VALUES ({z}, 'Zona"
            f" {z}');\n"
        )

    # 2. DEPARTAMENTOS
    f.write("\n-- 2. INSERTAR DEPARTAMENTOS\n")
    deptos = (
        df[['ID_DEPARTAMENTO', 'N_DEPARTAMENTO', 'ID_REGION']]
        .drop_duplicates()
        .sort_values('ID_DEPARTAMENTO')
    )
    for _, row in deptos.iterrows():
        nombre = str(row['N_DEPARTAMENTO']).replace("'", "''")
        f.write(
            "INSERT INTO departamentos (id_departamento, nombre_departamento,"
            f" id_zona) VALUES ({int(row['ID_DEPARTAMENTO'])},"
            f" '{nombre}', {int(row['ID_REGION'])});\n"
        )

    # 3. LOCALIDADES
    f.write("\n-- 3. INSERTAR LOCALIDADES\n")
    locs = (
        df[['ID_LOCALIDAD', 'N_LOCALIDAD', 'ID_DEPARTAMENTO']]
        .drop_duplicates()
        .sort_values('ID_LOCALIDAD')
    )
    for _, row in locs.iterrows():
        nombre = str(row['N_LOCALIDAD']).replace("'", "''")
        f.write(
            "INSERT INTO localidades (id_localidad, nombre_localidad,"
            f" id_departamento) VALUES ({int(row['ID_LOCALIDAD'])},"
            f" '{nombre}', {int(row['ID_DEPARTAMENTO'])});\n"
        )

    f.write("\nCOMMIT;\n")

print(f"¡Éxito! Archivo SQL generado en:\n{output_sql}")