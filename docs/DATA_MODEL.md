# Modelo de Datos, Bases de Datos y Almacenamiento Multimedia

Este documento detalla los modelos de datos de TypeScript, la arquitectura de la base de datos actual y alternativas de migración, así como el almacenamiento de archivos multimedia (Firebase Storage) para **Festis Cardigan**.

---

## 🗄️ 1. Arquitectura de Base de Datos

### ¿Para qué tipo de Base de Datos está pensada la app?
La aplicación está concebida arquitectónicamente como una **Base de Datos Orientada a Documentos (Document-Oriented NoSQL Datastore)**. 
- **Razón del diseño:** Los festivales de cine poseen metadatos altamente variables (diferentes plataformas, categorías impredecibles, listas incrustadas de tareas, gastos arbitrarios e historiales de estado con timestamps). Un modelo de documentos permite almacenar cada postulación como una entidad atómica con sus sub-arreglos (`statusHistory`, `tasks`, `costs`) sin necesidad de realizar complejos JOINs relacionales en cada consulta de interfaz.

### ¿En qué Base de Datos corre actualmente?
Actualmente la aplicación ejecuta sobre **Google Cloud Firestore** (instancia de base de datos `festis-cardigan`).
- **Sincronización en tiempo real:** Utiliza el motor WebSockets de Firestore (`onSnapshot`) para que las actualizaciones en festivales, notas y estados se reflejen instantáneamente en todos los clientes conectados.
- **Persistencia local (Offline):** IndexedDB en el navegador para resiliencia ante cortes de conectividad.

---

## 🔀 2. Guía de Migración a otras Bases de Datos (Distintas a Firestore)

Si se desea trasladar Festis Cardigan a un motor relacional (ej. **PostgreSQL**, **MySQL**, **Cloud SQL**) o a otra alternativa NoSQL (ej. **MongoDB**, **SQLite**), se debe seguir el siguiente patrón de desacoplamiento:

### A. Migración a Base de Datos Relacional (PostgreSQL / MySQL con Drizzle u ORM)
En un modelo SQL relacional, los sub-arreglos incrustados se desnormalizan en tablas independientes mediante llaves foráneas (`FOREIGN KEY`):

```sql
-- Tabla Principal de Festivales
CREATE TABLE festivals (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  platform VARCHAR(100),
  category VARCHAR(100),
  fee NUMERIC(10, 2) DEFAULT 0.00,
  deadline DATE,
  news_date DATE,
  projection_date DATE,
  projection_location TEXT,
  nomination TEXT,
  observations TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  pin_note TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Historial de Estados (Relación 1 a N)
CREATE TABLE status_history (
  id VARCHAR(64) PRIMARY KEY,
  festival_id VARCHAR(64) REFERENCES festivals(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_by VARCHAR(255),
  note TEXT
);

-- Tabla de Tareas (Relación 1 a N)
CREATE TABLE festival_tasks (
  id VARCHAR(64) PRIMARY KEY,
  festival_id VARCHAR(64) REFERENCES festivals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  assigned_to VARCHAR(255)
);

-- Tabla de Gastos Discriminados (Relación 1 a N)
CREATE TABLE festival_costs (
  id VARCHAR(64) PRIMARY KEY,
  festival_id VARCHAR(64) REFERENCES festivals(id) ON DELETE CASCADE,
  concept VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  date DATE
);
```

### B. Pasos Técnicos para Sustituir Firestore por SQL/MongoDB:
1. **Crear una interfaz de Repositorio (`src/services/FestivalRepository.ts`):**
   ```typescript
   export interface IFestivalRepository {
     getAll(): Promise<Festival[]>;
     getById(id: string): Promise<Festival | null>;
     create(festival: Omit<Festival, 'id'>): Promise<string>;
     update(id: string, data: Partial<Festival>): Promise<void>;
     delete(id: string): Promise<void>;
     subscribe(onUpdate: (festivals: Festival[]) => void): () => void;
   }
   ```
2. **Implementar el Adapter correspondiente:** Reemplazar las llamadas directas a `doc()` y `collection()` en `useFestivals.ts` por el cliente SQL (ej. `fetch('/api/festivals')` hacia el backend en `server.ts`).

---

## 🖼️ 3. Almacenamiento Multimedia y de Imágenes (Firebase Storage) y Alternativas

Para la gestión de afiches, flyers, fotogramas de prensa, laureles y prensa en alta resolución, Festis Cardigan utiliza predeterminadamente **Firebase Storage / Google Cloud Storage**.

### Estructura de Directorios en Storage:
```
gs://festis-cardigan.appspot.com/
├── posters/
│   ├── {festivalId}_poster.jpg         # Afiches y flyers oficiales del festival
│   └── {festivalId}_laurel.png        # Transparencias PNG de laureles obtenidos
├── film_assets/
│   ├── stills/                         # Fotogramas en alta resolución
│   └── presskit.pdf                    # Dossier de prensa en PDF
└── social_media/
    └── exports/                        # Renderizados del InstagramSimulator
```

### Proceso de Carga Predeterminado (Firebase Storage):
1. **Subida Directa desde el Cliente:**
   ```typescript
   import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

   export async function uploadFestivalPoster(festivalId: string, file: File): Promise<string> {
     const storage = getStorage();
     const storageRef = ref(storage, `posters/${festivalId}_${file.name}`);
     await uploadBytes(storageRef, file);
     return await getDownloadURL(storageRef);
   }
   ```
2. **Reglas de Seguridad de Storage (`storage.rules`):**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /posters/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /film_assets/{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### ⚙️ Configuración de Servicios de Almacenamiento Alternativos (S3, Cloudflare R2, Supabase, MinIO, Servidor Local)

Si se prefiere no utilizar Firebase Storage, Festis Cardigan puede configurarse para conectarse a cualquier proveedor de objetos compatible con la industria.

#### Opción A: Amazon S3 / Cloudflare R2 / MinIO (Servicio Compatible con S3 API)
Para utilizar AWS S3 o Cloudflare R2/MinIO, se utiliza un patrón de **URLs Firmadas (Presigned URLs)** procesadas desde el servidor backend (`server.ts`) para evitar exponer credenciales secretas en el frontend.

1. **Instalar dependencias en el servidor:**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Configurar el endpoint en `server.ts`:**
   ```typescript
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

   const s3Client = new S3Client({
     region: process.env.AWS_REGION || "us-east-1",
     endpoint: process.env.S3_CUSTOM_ENDPOINT, // Requerido para Cloudflare R2 o MinIO
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });

   app.post("/api/storage/presigned-url", async (req, res) => {
     try {
       const { filename, contentType, folder } = req.body;
       const key = `${folder || "uploads"}/${Date.now()}_${filename}`;
       const command = new PutObjectCommand({
         Bucket: process.env.S3_BUCKET_NAME!,
         Key: key,
         ContentType: contentType,
       });

       const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
       const publicUrl = `${process.env.S3_PUBLIC_CDN_URL}/${key}`;
       
       res.json({ uploadUrl, publicUrl });
     } catch (error) {
       res.status(500).json({ error: "Error generando presigned URL" });
     }
   });
   ```

3. **Reemplazar la función de carga en la aplicación (`src/services/storage.ts`):**
   ```typescript
   export async function uploadFileToCustomStorage(file: File, folder: string = "posters"): Promise<string> {
     const presignedRes = await fetch("/api/storage/presigned-url", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
     });
     
     const { uploadUrl, publicUrl } = await presignedRes.json();

     // Subida directa por HTTP PUT al bucket sin pasar la carga útil por Node.js
     await fetch(uploadUrl, {
       method: "PUT",
       headers: { "Content-Type": file.type },
       body: file,
     });

     return publicUrl;
   }
   ```

#### Opción B: Supabase Storage
1. **Instalar el cliente:** `npm install @supabase/supabase-js`
2. **Subida en `src/services/storage.ts`:**
   ```typescript
   import { createClient } from "@supabase/supabase-js";

   const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );

   export async function uploadToSupabase(file: File, path: string): Promise<string> {
     const { data, error } = await supabase.storage
       .from("festis-assets")
       .upload(path, file, { upsert: true });

     if (error) throw error;

     const { data: publicUrlData } = supabase.storage
       .from("festis-assets")
       .getPublicUrl(data.path);

     return publicUrlData.publicUrl;
   }
   ```

#### Opción C: Servidor Local de Archivos / Volumen en Disco (`/uploads`)
Si se ejecuta la aplicación en un servidor dedicado o contenedor Docker con volumen persistente montado:
1. **Endpoint de recepción multipart en `server.ts` con Express y Multer:**
   ```typescript
   import multer from "multer";
   import path from "path";

   const upload = multer({ dest: path.join(process.cwd(), "public/uploads") });

   app.post("/api/upload-local", upload.single("file"), (req, res) => {
     if (!req.file) return res.status(400).send("No file uploaded");
     const fileUrl = `/uploads/${req.file.filename}`;
     res.json({ url: fileUrl });
   });
   ```
2. Servir la carpeta estáticamente en `server.ts`: `app.use("/uploads", express.static("public/uploads"));`

---

## 📊 4. Entidad Principal TypeScript: `Festival`

Colección Firestore / Documento JSON: `festivals`

```json
{
  "id": "fest_98242",
  "name": "Festival Internacional de Cine de San Sebastián",
  "status": "En selección",
  "platform": "FilmFreeway",
  "category": "Cortometraje Ficción",
  "fee": 35.00,
  "deadline": "2026-08-15",
  "newsDate": "2026-09-01",
  "projectionDate": "2026-09-22",
  "projectionLocation": "Teatro Victoria Eugenia, San Sebastián",
  "nomination": "Premio del Público",
  "observations": "Se envió copia en DCP con subtítulos en inglés y euskera.",
  "isPinned": true,
  "pinNote": "Confirmar envío de póster impreso antes del 10 de Agosto",
  "archived": false,
  "createdAt": "2026-05-10T14:30:00.000Z",
  "updatedAt": "2026-07-30T18:20:00.000Z"
}
```

### Definición de Interfaces TypeScript

```typescript
export interface Festival {
  id: string;
  name: string;
  status: FestivalStatus;
  platform?: string;
  category?: string;
  fee?: number;
  deadline?: string;
  newsDate?: string;
  projectionDate?: string;
  projectionLocation?: string;
  nomination?: string;
  observations?: string;
  statusHistory?: StatusHistoryEntry[];
  tasks?: TaskItem[];
  costs?: CostEntry[];
  isPinned?: boolean;
  pinNote?: string;
  archived?: boolean;
  posterUrl?: string;
  editionYear?: number;
  editionNumber?: number;
  previousEditionId?: string;
  editionHistory?: Array<{ id: string; name: string; year?: number; status: FestivalStatus; createdAt?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export enum FestivalStatus {
  POR_ENVIAR = "Por enviar",
  PROXIMAMENTE = "Próximamente",
  EN_REVISION = "En revisión",
  EN_DUDA = "En duda",
  SELECCIONADO = "Seleccionado",
  PROYECTADO = "Proyectado",
  GANADO = "Ganado",
  NO_SELECCIONADO = "No seleccionado",
  DESCALIFICADO = "Descalificado",
  CERRADO = "Cerrado"
}

export interface StatusHistoryEntry {
  id: string;
  status: FestivalStatus;
  timestamp: string;  // ISO 8601 string (Ej: "2026-07-30T23:55:00.000Z")
  updatedBy?: string; // Nombre/Email del usuario
  note?: string;      // Justificación del veredicto
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
}

export interface CostEntry {
  id: string;
  concept: string;
  amount: number;
  currency: string;
  date: string;
}
```

---

## 📚 4. Catálogo Oficial de Colecciones en Firestore (Multi-Tenant)

La aplicación **Festis** opera sobre la base de datos Firestore `festis-db-a` y el bucket de Storage `festis-bucket-a` con una arquitectura jerárquica multi-tenant:

### A. Colección Raíz de Proyectos / Obras Audiovisuales
Ruta: `/projects/{projectId}`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único del proyecto / obra. |
| `name` | `string` | Nombre o título de la obra audiovisual. |
| `fps` | `number` | Cuadros por segundo (24, 25, 30, 60, etc.). |
| `resolution` | `string` | Resolución de entrega (1920x1080, 4K UHD, 2K DCI, etc.). |
| `tags` | `string[]` | Etiquetas temáticas o de género (Ficción, Drama, Animación, etc.). |
| `description` | `string` | Sinopsis o descripción breve del proyecto. |
| `iconUrl` | `string` | URL en Firebase Storage del isotipo/afiche de la obra. |
| `theme` | `object` | Identidad cromática (colorDominante, colorSub, colorAcento, tipoFondo, valorFondo). |
| `authorizedUsers` | `string[]` | Lista de emails autorizados para acceder y editar este proyecto. |
| `createdBy` | `string` | Email del creador/propietario del proyecto. |
| `ownerId` | `string` | UID o email del creador/propietario. |
| `createdAt` | `string` (ISO) | Fecha de alta del proyecto. |
| `updatedAt` | `string` (ISO) | Fecha de última modificación. |

### B. Subcolecciones Aisladas por Proyecto
Ruta: `/projects/{projectId}/{subcollection}`

| # | Subcolección | Tipo | Descripción Funcional |
|---|--------------|------|-----------------------|
| 1 | `festivals` | Documentos | Festivales postulados de la obra, estados, fechas, tareas y gastos. |
| 2 | `distribution_plans` | Documentos | Planes de distribución, metas e instituciones del proyecto. |
| 3 | `institutions` | Documentos | Organismos reguladores y mecenazgos asociados al plan. |
| 4 | `filmData` | Documentos | Ficha técnica completa de la obra (sinopsis, equipo, enlaces). |
| 5 | `reminders` | Documentos | Recordatorios y convocatorias prioritarias de la obra. |
| 6 | `notes` | Documentos | Bitácora y notas de producción de la obra. |
| 7 | `gallery` | Documentos | Afiches, fotogramas y assets de prensa del proyecto. |
| 8 | `social_posts` | Documentos | Calendario y publicaciones de difusión en redes sociales. |

### C. Colecciones Globales del Sistema
Ruta: `/{collection}`

| # | Colección | Descripción |
|---|-----------|-------------|
| 1 | `platforms` | Plataformas de postulación predeterminadas y compartidas. |
| 2 | `members` | Miembros de equipo, colaboradores y credenciales. |
| 3 | `auditlogs` | Registro forense de acciones y cambios auditables. |
| 4 | `bugs` | Tickets de reporte de incidentes y estado de bugs. |
| 5 | `roadmap` | Hitos planificados y hoja de ruta del sistema. |
| 6 | `notifications` | Notificaciones del sistema para el usuario autenticado. |

---

## 💾 5. Arquitectura de Exportación, Validación y Restauración (Backup & Restore)

### Formato de Paquete ZIP y JSON Completo
El sistema genera un paquete ZIP que contiene tanto el volcado integral (`cardigan_db_full.json`) como archivos individuales por cada colección:
- `festivals.json`, `distributionPlans.json`, `institutions.json`, `platforms.json`, `reminders.json`, `filmData.json`, `members.json`, `auditLogs.json`, `notes.json`, `socialPosts.json`, `gallery.json`, `bugs.json`, `roadmap.json`, `notifications.json`.

### Validación Sanitizada (`src/utils/backupValidator.ts`)
Antes de restaurar o importar cualquier backup a Firestore:
1. Se valida que el JSON contenga una estructura reconocible y que los registros contengan identificadores válidos (`id`).
2. Se sanitizan las 14 colecciones descartando objetos corruptos o incompletos.
3. Se genera un resumen de validación que reporta al usuario exactamente qué módulos fueron detectados antes de escribir en la base de datos.
4. Si la validación es exitosa, se ejecutan los setters reactivos correspondientes en Firestore, actualizando el estado de la aplicación y emitiendo el log de auditoría.
