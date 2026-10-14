import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FestivalModal } from "../components/FestivalModal";
import { ProjectProvider } from "../context/ProjectContext";
import { Festival, FestivalStatus } from "../types";

// Mock de audio y funciones de ayuda
vi.mock("../utils/storageHelpers", () => ({
  uploadFileToStorage: vi.fn().mockResolvedValue("https://storage.googleapis.com/fake-laurel.webp"),
}));

const mockFestivals: Festival[] = [];
const mockSetFestivals = vi.fn();
const mockSetSelectedFestival = vi.fn();
const mockAddAuditLog = vi.fn();
const mockShowAlert = vi.fn();
const mockOnClose = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  modalType: "create" as const,
  selectedFestival: null,
  userName: "Axel Ibarra",
  isAuthorized: true,
  isDev: false,
  festivals: mockFestivals,
  setFestivals: mockSetFestivals,
  setSelectedFestival: mockSetSelectedFestival,
  addAuditLog: mockAddAuditLog,
  showAlert: mockShowAlert,
  platforms: [{ id: "1", name: "FilmFreeway", icon: "Globe" }],
  distributionPlans: [],
};

const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <ProjectProvider>
      {ui}
    </ProjectProvider>
  );
};

describe("FestivalModal - Clipboard Permissions-Policy Fallback & Ergonomics", () => {
  const originalClipboard = { ...navigator.clipboard };

  beforeEach(() => {
    vi.clearAllMocks();
    mockShowAlert.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
  });

  it("renderiza el botón de autocompletado icon-only en modo creación aún con estado residual y lo oculta en edición", () => {
    // 1. Modo creación puro: debe existir
    const { unmount } = renderWithContext(<FestivalModal {...defaultProps} modalType="create" selectedFestival={null} />);
    const pasteBtn = screen.getByLabelText("Autocompletar desde portapapeles");
    expect(pasteBtn).toBeInTheDocument();
    expect(pasteBtn).toHaveAttribute("title", "Autocompletar desde portapapeles");
    expect(pasteBtn.textContent).toBe(""); // Icon-only: cero texto visible
    expect(pasteBtn.className).toContain("min-w-[44px]");
    expect(pasteBtn.className).toContain("min-h-[44px]");
    unmount();

    // 2. Modo creación con estado residual (selectedFestival no nulo): DEBE seguir visible
    const mockExisting: Festival = {
      id: "f-123",
      name: "Sitges Film Festival",
      country: "España",
      deadline: "2026-07-15",
      type: "Internacional",
      tasks: [],
      status: FestivalStatus.POR_ENVIAR,
      statusHistory: [],
    };
    const { unmount: unmountResidual } = renderWithContext(
      <FestivalModal {...defaultProps} modalType="create" selectedFestival={mockExisting} />
    );
    expect(screen.getByLabelText("Autocompletar desde portapapeles")).toBeInTheDocument();
    unmountResidual();

    // 3. En modo edición de un festival existente, debe estar 100% ausente
    const { unmount: unmountEdit } = renderWithContext(
      <FestivalModal {...defaultProps} modalType="edit" selectedFestival={mockExisting} />
    );
    expect(screen.queryByLabelText("Autocompletar desde portapapeles")).not.toBeInTheDocument();
    unmountEdit();

    // 4. En modo apertura de nueva edición, debe estar 100% ausente
    renderWithContext(
      <FestivalModal {...defaultProps} modalType="new_edition" selectedFestival={mockExisting} />
    );
    expect(screen.queryByLabelText("Autocompletar desde portapapeles")).not.toBeInTheDocument();
  });

  it("abre defensivamente el submodal de pegado manual ante NotAllowedError por Permissions-Policy", async () => {
    // Simular el bloqueo de Permissions-Policy en el iframe de Cloud Run
    const notAllowedError = new Error("The Clipboard API has been blocked because of a permissions policy applied to the current document.");
    notAllowedError.name = "NotAllowedError";

    Object.defineProperty(navigator, "clipboard", {
      value: {
        readText: vi.fn().mockRejectedValue(notAllowedError),
      },
      configurable: true,
      writable: true,
    });

    renderWithContext(<FestivalModal {...defaultProps} />);

    const pasteBtn = screen.getByLabelText("Autocompletar desde portapapeles");
    fireEvent.click(pasteBtn);

    // Debe desplegarse el diálogo de contingencia con el textarea y botón procesador
    await waitFor(() => {
      expect(screen.getByText("Pegar texto del festival")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Pegá acá la convocatoria/i);
    expect(textarea).toBeInTheDocument();
    expect(screen.getByText("Procesar y Autocompletar")).toBeInTheDocument();
  });

  it("procesa e hidrata los campos del formulario desde el submodal manual y se cierra automáticamente", async () => {
    // Simular bloqueo de API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        readText: vi.fn().mockRejectedValue(new Error("SecurityError")),
      },
      configurable: true,
      writable: true,
    });

    renderWithContext(<FestivalModal {...defaultProps} />);

    // Abrir submodal de contingencia
    const pasteBtn = screen.getByLabelText("Autocompletar desde portapapeles");
    fireEvent.click(pasteBtn);

    await waitFor(() => {
      expect(screen.getByText("Pegar texto del festival")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Pegá acá la convocatoria/i);
    const processBtn = screen.getByText("Procesar y Autocompletar");

    // Ingresar texto con datos de festival identificables por el motor Cardigan
    const rawFestivalText = `
      Convocatoria abierta para el BAFICI - Buenos Aires Festival Internacional de Cine Independiente.
      Fecha límite: 2026-11-20
      País: Argentina
      Costo: Gratis
      Link: https://bafici.gob.ar
    `;

    fireEvent.change(textarea, { target: { value: rawFestivalText } });
    fireEvent.click(processBtn);

    // Esperar hidratación y cierre del submodal
    await waitFor(() => {
      expect(screen.queryByText("Pegar texto del festival")).not.toBeInTheDocument();
    });

    // Validar hidratación en el campo de nombre del formulario principal
    const nameInput = document.getElementById("m-name") as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe("Buenos Aires Festival Internacional de Cine Independiente");
    expect(mockShowAlert).toHaveBeenCalledWith(
      "Festival 'Buenos Aires Festival Internacional de Cine Independiente' autocompletado."
    );
  });

  it("falla con gracia ante texto manual insuficiente o corrupto impidiendo el cierre erróneo", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        readText: vi.fn().mockRejectedValue(new Error("NotAllowedError")),
      },
      configurable: true,
      writable: true,
    });

    renderWithContext(<FestivalModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Autocompletar desde portapapeles"));

    await waitFor(() => {
      expect(screen.getByText("Pegar texto del festival")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Pegá acá la convocatoria/i);
    const processBtn = screen.getByText("Procesar y Autocompletar");

    // Texto corrupto o basura que no constituye un festival
    fireEvent.change(textarea, { target: { value: "1234" } });
    fireEvent.click(processBtn);

    // Debe mostrar alerta de rechazo y permanecer abierto para permitir corregir
    expect(mockShowAlert).toHaveBeenCalledWith("El texto pegado es demasiado corto.");
    expect(screen.getByText("Pegar texto del festival")).toBeInTheDocument();
  });

  it("ejecuta hidratación directa cuando la Clipboard API responde con permisos concedidos", async () => {
    const validText = `Sitges Film Festival 2026 - Deadline: 2026-08-30 - Spain - Fee: 45 USD - https://sitgesfilmfestival.com`;

    Object.defineProperty(navigator, "clipboard", {
      value: {
        readText: vi.fn().mockResolvedValue(validText),
      },
      configurable: true,
      writable: true,
    });

    renderWithContext(<FestivalModal {...defaultProps} />);

    const pasteBtn = screen.getByLabelText("Autocompletar desde portapapeles");
    fireEvent.click(pasteBtn);

    await waitFor(() => {
      const nameInput = document.getElementById("m-name") as HTMLInputElement;
      expect(nameInput.value).toBe("Sitges - Festival Internacional de Cinema Fantàstic de Catalunya");
    });

    // No debe haberse abierto el modal manual porque la lectura directa funcionó
    expect(screen.queryByText("Pegar texto del festival")).not.toBeInTheDocument();
    expect(mockShowAlert).toHaveBeenCalledWith(
      "Festival 'Sitges - Festival Internacional de Cinema Fantàstic de Catalunya' autocompletado."
    );
  });
});
