import { Document, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType, Packer } from "docx";

export type ReporteAcuerdo = {
  texto: string;
  fechaCompromiso: string | null;
  responsable: string | null;
  estatus: string;
  origenTexto: string | null;
  origenNumeroSesion: number | null;
};

export type ReporteAlerta = {
  clasificacion: string | null;
  citaLiteral: string | null;
  justificacion: string | null;
};

export type ReporteAsistente = {
  nombre: string;
  cargo: string | null;
  parte: string;
  esSecretarioTecnico: boolean;
};

export type ReporteComparativoSesion = {
  numeroSesion: number;
  fecha: string;
  quorumCertificado: boolean;
  totalAcuerdos: number;
  pctConFecha: number | null;
  pctCumplidos: number | null;
};

export type ReporteComparativo = {
  sesiones: ReporteComparativoSesion[];
  evolucionTematica: { tema: string; numerosSesion: number[] }[];
  sintesis: {
    totalAcuerdos: number;
    pctConFecha: number | null;
    acuerdosVencidos: number;
    alertasSinClasificar: number;
  };
};

export type ReporteSesionData = {
  ooadNombre: string;
  numeroSesion: number;
  tipo: string;
  fecha: string;
  sede: string | null;
  quorumCertificado: boolean;
  totalPuntos: number;
  asistentes: ReporteAsistente[];
  acuerdos: ReporteAcuerdo[];
  alertas: ReporteAlerta[];
  comparativo: ReporteComparativo | null;
};

const ETIQUETAS_ESTATUS: Record<string, string> = {
  vigente: "Vigente",
  cumplido: "Cumplido",
  incumplido: "Incumplido",
  sin_seguimiento: "Sin seguimiento",
  no_verificable: "No verificable",
};

const NUMEROS_ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function titulo(texto: string) {
  return new Paragraph({ text: texto, heading: HeadingLevel.HEADING_1 });
}

function subtitulo(texto: string) {
  return new Paragraph({ text: texto, heading: HeadingLevel.HEADING_2 });
}

function celda(texto: string, opciones: { negrita?: boolean } = {}) {
  return new TableCell({
    width: { size: 2000, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: texto, bold: opciones.negrita })] })],
  });
}

function filaEncabezado(columnas: string[]) {
  return new TableRow({ children: columnas.map((c) => celda(c, { negrita: true })) });
}

export async function construirReporteDocx(datos: ReporteSesionData): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({ text: "Reporte de sesión GTAP Delegacional", heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `${datos.ooadNombre} — Sesión ${datos.numeroSesion}` }),
  );

  // 1. Resumen
  children.push(titulo("I. Resumen"));
  const acuerdosConFecha = datos.acuerdos.filter((a) => a.fechaCompromiso).length;
  children.push(
    new Paragraph({ text: `Tipo de sesión: ${datos.tipo} · Fecha: ${datos.fecha} · Sede: ${datos.sede ?? "no verificable"}` }),
    new Paragraph({ text: `Quórum certificado: ${datos.quorumCertificado ? "sí" : "no"}` }),
    new Paragraph({ text: `Puntos del orden del día: ${datos.totalPuntos}` }),
    new Paragraph({ text: `Acuerdos capturados: ${datos.acuerdos.length} (con fecha compromiso: ${acuerdosConFecha}/${datos.acuerdos.length})` }),
    new Paragraph({ text: `Alertas de competencia central: ${datos.alertas.length}` }),
  );

  // 2. Datos generales y asistencia
  children.push(titulo("II. Datos generales y asistencia"));
  if (datos.asistentes.length) {
    children.push(
      new Table({
        width: { size: 8000, type: WidthType.DXA },
        rows: [
          filaEncabezado(["Nombre", "Cargo", "Parte", "Secretario Técnico"]),
          ...datos.asistentes.map(
            (a) =>
              new TableRow({
                children: [
                  celda(a.nombre),
                  celda(a.cargo ?? "no verificable"),
                  celda(a.parte === "imss" ? "IMSS" : "SNTSS"),
                  celda(a.esSecretarioTecnico ? "Sí" : ""),
                ],
              }),
          ),
        ],
      }),
    );
  } else {
    children.push(new Paragraph({ text: "Sin asistentes registrados." }));
  }

  // 3. Acuerdos relevantes
  children.push(titulo("III. Acuerdos relevantes"));
  if (datos.acuerdos.length) {
    children.push(
      new Table({
        width: { size: 8000, type: WidthType.DXA },
        rows: [
          filaEncabezado(["Acuerdo", "Fecha compromiso", "Responsable", "Estatus"]),
          ...datos.acuerdos.map(
            (a) =>
              new TableRow({
                children: [
                  celda(a.texto),
                  celda(a.fechaCompromiso ?? "no verificable"),
                  celda(a.responsable ?? "no verificable"),
                  celda(ETIQUETAS_ESTATUS[a.estatus] ?? a.estatus),
                ],
              }),
          ),
        ],
      }),
    );
  } else {
    children.push(new Paragraph({ text: "Sin acuerdos registrados." }));
  }

  let numeroSeccion = 3;
  const siguienteNumero = () => NUMEROS_ROMANOS[numeroSeccion++] ?? String(numeroSeccion);

  // 4. Seguimiento de acuerdos anteriores
  const acuerdosConSeguimiento = datos.acuerdos.filter((a) => a.origenTexto);
  if (acuerdosConSeguimiento.length) {
    children.push(titulo(`${siguienteNumero()}. Seguimiento de acuerdos de sesiones anteriores`));
    acuerdosConSeguimiento.forEach((a) => {
      children.push(
        new Paragraph({
          text: `Sesión ${a.origenNumeroSesion}: "${a.origenTexto}" → seguido en esta sesión: "${a.texto}"`,
        }),
      );
    });
  }

  // 5. Alertas de competencia central
  children.push(titulo(`${siguienteNumero()}. Alertas de competencia central`));
  if (datos.alertas.length) {
    children.push(
      new Table({
        width: { size: 8000, type: WidthType.DXA },
        rows: [
          filaEncabezado(["Tema / subtema", "Clasificación", "Justificación"]),
          ...datos.alertas.map(
            (a) =>
              new TableRow({
                children: [
                  celda(a.citaLiteral ?? "no verificable"),
                  celda(a.clasificacion ?? "sin clasificar"),
                  celda(a.justificacion ?? "no verificable"),
                ],
              }),
          ),
        ],
      }),
    );
  } else {
    children.push(new Paragraph({ text: "Sin alertas registradas en esta sesión." }));
  }

  // 6. Comparativo entre sesiones
  if (datos.comparativo) {
    const c = datos.comparativo;
    const nSeccionComparativo = siguienteNumero();
    children.push(titulo(`${nSeccionComparativo}. Comparativo entre sesiones`));

    children.push(subtitulo(`${nSeccionComparativo}.A Datos generales comparativos`));
    children.push(
      new Table({
        width: { size: 8000, type: WidthType.DXA },
        rows: [
          filaEncabezado(["Sesión", "Fecha", "Quórum certificado", "Total acuerdos"]),
          ...c.sesiones.map(
            (s) =>
              new TableRow({
                children: [
                  celda(String(s.numeroSesion)),
                  celda(s.fecha),
                  celda(s.quorumCertificado ? "Sí" : "No"),
                  celda(String(s.totalAcuerdos)),
                ],
              }),
          ),
        ],
      }),
    );

    children.push(subtitulo(`${nSeccionComparativo}.B Evolución temática`));
    if (c.evolucionTematica.length) {
      c.evolucionTematica.forEach((t) => {
        children.push(new Paragraph({ text: `${t.tema}: sesiones ${t.numerosSesion.join(", ")}` }));
      });
    } else {
      children.push(new Paragraph({ text: "Sin temas del catálogo vinculados en estas sesiones." }));
    }

    children.push(subtitulo(`${nSeccionComparativo}.C Indicadores de madurez operativa`));
    children.push(
      new Table({
        width: { size: 8000, type: WidthType.DXA },
        rows: [
          filaEncabezado(["Sesión", "% con fecha compromiso", "% cumplidos"]),
          ...c.sesiones.map(
            (s) =>
              new TableRow({
                children: [
                  celda(String(s.numeroSesion)),
                  celda(s.pctConFecha === null ? "no verificable" : `${s.pctConFecha}%`),
                  celda(s.pctCumplidos === null ? "no verificable" : `${s.pctCumplidos}%`),
                ],
              }),
          ),
        ],
      }),
    );

    children.push(subtitulo(`${nSeccionComparativo}.D Síntesis`));
    children.push(
      new Paragraph({
        text: `Total de acuerdos en las ${c.sesiones.length} sesiones: ${c.sintesis.totalAcuerdos} (con fecha compromiso: ${
          c.sintesis.pctConFecha === null ? "no verificable" : `${c.sintesis.pctConFecha}%`
        }) · Acuerdos vencidos: ${c.sintesis.acuerdosVencidos} · Alertas sin clasificar: ${c.sintesis.alertasSinClasificar}`,
      }),
    );
  }

  // Hallazgos (vacíos explícitos, nunca inferidos)
  const hallazgos: string[] = [];
  if (!datos.quorumCertificado) hallazgos.push("El quórum de esta sesión no está certificado.");
  const sinFecha = datos.acuerdos.filter((a) => !a.fechaCompromiso).length;
  if (sinFecha) hallazgos.push(`${sinFecha} de ${datos.acuerdos.length} acuerdos no tienen fecha compromiso.`);
  const sinResponsable = datos.acuerdos.filter((a) => !a.responsable).length;
  if (sinResponsable) hallazgos.push(`${sinResponsable} de ${datos.acuerdos.length} acuerdos no tienen responsable asignado.`);
  const sinClasificar = datos.alertas.filter((a) => !a.clasificacion).length;
  if (sinClasificar) hallazgos.push(`${sinClasificar} alerta(s) de competencia central sin clasificar.`);

  children.push(titulo(`${siguienteNumero()}. Hallazgos`));
  if (hallazgos.length) {
    hallazgos.forEach((h) => children.push(new Paragraph({ text: h })));
  } else {
    children.push(new Paragraph({ text: "Sin hallazgos pendientes en los campos verificados." }));
  }

  const documento = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(documento);
}
