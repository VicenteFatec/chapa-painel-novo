import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, LogOut, Award } from 'lucide-react';
import './MainLayout.css';

function MainLayout() {
  const navigate = useNavigate();
  const userEmail = "teste@empresa.com"; 

  const handleLogout = () => {
    console.log("Logout realizado");
    navigate('/login');
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/images/logo.svg" alt="Chapa Amigo Empresas Logo" className="logo" />
          {/* ALTERADO: Adicionamos o título ao lado do logo */}
          <h1>Chapa Amigo Empresas</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-link">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/solicitacoes" className="nav-link">
            <ClipboardList size={20} />
            <span>Mesa de Operações</span>
          </NavLink>
          <NavLink to="/talentos" className="nav-link">
            <Award size={20} />
            <span>Gestão de Trabalhadores</span>
          </NavLink>
          <NavLink to="/frota" className="nav-link">
            <Users size={20} />
            <span>Minha Frota</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;