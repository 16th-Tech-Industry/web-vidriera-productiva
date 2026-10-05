import "./footer_landing.css";
import logo from '../../assets/ministerio+cba.svg';
import logo_facebook from '../../assets/facebook.png';
import logo_twitter from '../../assets/twitter.png';
import logo_instagram from '../../assets/instagram.png';
export const Footer = () => {
  return (
    <footer className="footer">
      <section className="logo-footer">
        <img src={logo} alt="Logo" />
      </section>
      <section className="contact-footer">
        <p>Oficinas de Atencion</p>
        <p>Email: cbaexpone@gmail.com</p>
        <p>Telefono: (0351) 4342143</p>
      </section>
      <section className="social-footer">
        <div>
          <a href="https://www.facebook.com/"><img src={logo_facebook} alt="Facebook" /></a>
          <a href="https://x.com/?lang=es"><img src={logo_twitter} alt="Twitter" /></a>
          <a href="https://www.instagram.com/"><img src={logo_instagram} alt="Instagram" /></a>
        </div>
      </section>
    </footer>
  );
};
