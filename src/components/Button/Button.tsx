import "./Button.css"

//Creo una interfaz(Padre) para definir las propiedades que recibira el componente Button.
interface Props {
    label: string
    parentMethod: () => void
}
//Creo una variable que exporta el componente Button, ademas agrego un metodo como disparador desde el padre.
export const Button = ({ label, parentMethod }: Props) => {

  return (
    <button className="custom-button" onClick={parentMethod}>
      {label}
    </button>
  )
}