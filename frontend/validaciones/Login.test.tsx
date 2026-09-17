// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Login } from '../src/components/Login/Login';

describe('Pruebas del componente Login (Frontend)', () => {
  it('TC-L-10 / TC-L-11: Muestra error si la contraseña es menor a 8 caracteres o está vacía', async () => {
    render(<Login />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    
    // Seleccionamos el botón de envío de manera segura
    const submitButtons = screen.getAllByRole('button', { name: /continuar/i });
    const submitButton = submitButtons[0];

    // Ingresamos un email válido pero una contraseña corta
    fireEvent.change(emailInput, { target: { value: 'usuario@correo.com' } });
    fireEvent.change(passwordInput, { target: { value: 'corta' } });

    fireEvent.click(submitButton);

    // Verificamos que aparezca el mensaje de error de contraseña en pantalla
    const errorMessage = await screen.findByText(/la contraseña debe tener al menos 8 caracteres/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('TC-L-09: Muestra error si el email no tiene formato correcto', async () => {
    render(<Login />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    
    // Seleccionamos el botón de envío de manera segura
    const submitButtons = screen.getAllByRole('button', { name: /continuar/i });
    const submitButton = submitButtons[0];

    // Ingresamos un email inválido
    fireEvent.change(emailInput, { target: { value: 'noesunemail' } });
    fireEvent.click(submitButton);

    const errorMessage = await screen.findByText(/ingresa un correo electrónico válido/i);
    expect(errorMessage).toBeInTheDocument();
  });
});