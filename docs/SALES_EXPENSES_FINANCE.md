# Módulo de Finanzas, Presupuestos, Costos y Retorno de Inversión (ROI) — Guía Técnica

Este documento especifica la arquitectura de cálculo económico, conversión multidivisa, registro de gastos de inscripción (*fees*), premios en efectivo (*awards*) y análisis de balance financiero en **Festis Cardigan**.

---

## 💰 1. Visión General del Subsistema Financiero

La distribución de obras cinematográficas en el circuito internacional de festivales involucra costos significativos en fees de postulación (a través de plataformas como FilmFreeway, Festhome, ShortFilmDepot y Movibeta), gastos de producción de copias de exhibición (DCPs, discos rígidos, envíos diplomáticos), servicios de traducción de subtítulos y fees de agencias de ventas.

**Festis Cardigan** provee un motor financiero integrado que permite:
1. Registrar gastos en moneda local (EUR, USD, ARS, GBP, BRL, JPY, CAD) con conversión en tiempo real.
2. Balancear la inversión contra ingresos directos recibidos (premios en efectivo, honorarios por proyección o *screening fees*).
3. Calcular métricas clave de salud económica: Costo Medio por Postulación, Costo Medio por Selección Efectiva y Retorno de Inversión (ROI).

---

## 📐 2. Modelo de Datos Financieros (`Festival` & `Expense`)

Cada registro de festival dentro del sistema contiene campos financieros específicos definidos en `src/types.ts`:

```typescript
export interface Festival {
  id: string;
  name: string;
  
  // Campos Financieros
  fee: number;               // Costo de inscripción en moneda original
  feeCurrency?: string;      // Código de divisa ('USD', 'EUR', 'ARS', 'GBP', etc.)
  feeUsd: number;            // Equivalente unificado en Dólares Estadounidenses (USD)
  
  // Ingresos Directos
  awardPrizeValue?: number;  // Valor monetario de premios ganados (USD)
  screeningFee?: number;     // Honorario pagado por el festival para proyectar la obra (USD)
  
  // Gastos Adicionales Asociados
  expenses?: FestivalExpense[];
}

export interface FestivalExpense {
  id: string;
  festivalId: string;
  concept: string;           // Ej: 'Envío de copia DCP', 'Traducción Subtítulos Francés'
  amount: number;            // Monto del gasto
  currency: string;          // Divisa del gasto
  amountUsd: number;         // Monto convertido a USD
  category: 'submission' | 'shipping' | 'subtitles' | 'marketing' | 'travel';
  date: string;
}
```

---

## 🔄 3. Lógica de Conversión Multidivisa y Tasas Unificadas

Para presentar estadísticas agregadas uniformes en la vista `StatsView.tsx` y en los informes PDF (`projectionsPdfExport.ts`), la aplicación convierte todos los valores monetarios a la divisa base (USD).

```
                      ┌─────────────────────────────────┐
                      │  Monto en Moneda Original (e.g. 50 EUR) │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │    Tasa de Conversión Local     │
                      │  (USD = Amount * CurrencyRate)  │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │  Monto Unificado `feeUsd` (USD) │
                      └─────────────────────────────────┘
```

El cálculo del balance neto (*Net Financial Balance*) se rige por la fórmula:

$$\text{Balance Neto (USD)} = (\sum \text{Premios} + \sum \text{Screening Fees}) - (\sum \text{Fees Inscripción} + \sum \text{Gastos Operativos})$$

---

## 📊 4. Análisis Estadístico y Retorno de Inversión (`StatsView.tsx`)

En la vista analítica `src/components/StatsView.tsx`, los datos económicos se procesan dinámicamente mediante los siguientes indicadores:

- **Inversión Total en Festivales:** Sumatoria de `feeUsd` de todas las postulaciones realizadas.
- **Costo por Selección Efectiva (Cost Per Acceptance):**
  $$\text{Costo/Selección} = \frac{\text{Inversión Total}}{\text{Número de Festivales en Estado 'Seleccionado' o 'Ganador'}}$$
- **Tasa de Retorno Financiero (% ROI):**
  $$\text{ROI} = \left( \frac{\text{Ingresos Totales - Inversión Total}}{\text{Inversión Total}} \right) \times 100$$
- **Modal de Auditoría de Gastos (ROI Audit Modal):** Accesible mediante el botón "Auditar Gastos" en la tarjeta de ROI. Despliega la lista completa de festivales evaluados con su monto de inversión en USD, el porcentaje exacto que representa cada uno respecto del total gastado y una **barra de progreso visual relativa**. Excluye de los gastos ejecutados aquellos festivales en estado 'Cerrado' que vencieron o se cerraron sin haber sido postulados/enviados efectivamente (`wasFestivalSubmitted = false`), garantizando que la inversión calculada sea 100% real y sin cobros no desembolsados.

---

## 📑 5. Reportes Financieros PDF (`projectionsPdfExport.ts`)

Ubicación del Generador: `src/utils/projectionsPdfExport.ts`

El módulo de exportación de proyecciones financieras compila un informe oficial de 2 páginas con las siguientes secciones:

1. **Cuadro Comparativo de Presupuesto:** Compara el presupuesto máximo asignado a la distribución de la película contra el gasto acumulado ejecutado a la fecha.
2. **Tabla de Gastos por Categoria:** Desglose gráfico del presupuesto invertido en Fees de Inscripción, Envíos Postales, Subtitulado y Materiales de Prensa.
3. **Flujo de Caja y Proyección de Premios:** Historial de ingresos recuperados por premios en efectivo y proyección de retorno financiero estimado según la tasa histórica de selección del catálogo.
