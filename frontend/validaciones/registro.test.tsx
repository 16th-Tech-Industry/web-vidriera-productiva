//@vitest-enviroment jsdom
import { describe, it,expect } from 'vitest';
//import '@testing-library/jest-dom/vitest'; 
import {render, screen, fireEvent} from '@testing-library/react';
import { Registro } from '../src/components/Registro/Registro';

describe ('Pruebas Registro(FrontEnd)', ()=>{
  it ('TC-R-02; Muestra de errores de campos obliogarotios', async()=>{
    render (<Registro/>);

    const submitButton= screen.getByRole('button', {name: /continuar/i});
    fireEvent.click(submitButton);

    expect (await screen.findByText(/El nombre es obligatorio/i)).toBeInTheDocument();

    expect (await screen.findByText(/El apellido es obligatorio/i)).toBeInTheDocument();

    expect (await screen.findByText(/El email es obligatorio/i)).toBeInTheDocument();
  });
  
  it ('TC-R-05; Muestra error si contrasenias no coinciden', async()=>{
    render (<Registro/>);
   
    const passInput=screen.getByLabelText(/^contrasenia/i);
    const confirmPassInput= screen.getByLabelText(/^confirmar contrasenia/i);
    const submitButton= screen.getByRole('button', {name: /continuar/i});
    
    fireEvent.change(passInput, {target: {value: 'Clave1234'}});

    fireEvent.change(confirmPassInput, {target: {value: 'Otra9999'}});

    fireEvent.click(submitButton);

    expect(await screen.findByText(/contresenias no coinciden/i)).toBeInTheDocument();
  });
});