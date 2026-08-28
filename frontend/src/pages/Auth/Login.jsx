import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import "./Login.css";

export default function Login(){

  const {theme,toggleTheme}=useTheme();

  return(
    <div className="login-page">

      <button className="theme-toggle" onClick={toggleTheme}>
        {theme==="light"?<Moon size={18}/>:<Sun size={18}/>}
      </button>

      <div className="login-card">

        <div className="login-logo">
          <div className="logo-box">R</div>
          <h1>REN ERP</h1>
          <p>Business OS</p>
        </div>

        <input placeholder="E-posta"/>
        <input placeholder="Şifre" type="password"/>

        <button className="login-btn">
          Giriş Yap
        </button>

        <div className="login-links">
          <a href="#">Şifremi Unuttum</a>
          <a href="#">Hesap Oluştur</a>
        </div>

      </div>

    </div>
  );
}