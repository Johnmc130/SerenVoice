import React from 'react';
import ActualizarPerfil from '../../Pages/PaginasUsuarios/ActualizarPerfil.jsx';
import "../../styles/StylesAdmin/AdminPages.css";

export default function PerfilAdmin(){
  return (
    <div className="admin-perfil-page">
      <div className="admin-page-content">
        <ActualizarPerfil showNavbar={false} />
      </div>
    </div>
  );
}
