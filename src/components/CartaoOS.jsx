import React from 'react';
import './CartaoOS.css'; // ALTERADO
import { User, Hash, Briefcase, Info, AlertTriangle } from 'lucide-react';

const formatarDocumento = (doc, tipo) => {
    if (!doc) return 'N/A';
    if (tipo === 'cpf') {
        return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4");
    }
    if (tipo === 'rg') {
        return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.***.***-$4");
    }
    return doc;
};

// ALTERADO
function CartaoOS({ solicitacao, trabalhador }) {
    if (!solicitacao || !trabalhador) {
        return <div className="cartao-os-loading">Carregando dados...</div>;
    }

    return (
        // ALTERADO
        <div id="cartao-os-para-exportar" className="cartao-os-container">
            <header className="cartao-os-header">
                <h2>PASSAPORTE DE SERVIÇO</h2>
                <div className="cartao-os-os">
                    <Hash size={16} />
                    <span>{solicitacao.osNumber || 'OS-0000'}</span>
                </div>
            </header>

            <section className="cartao-os-secao-trabalhador">
                <div className="trabalhador-avatar">
                    {trabalhador.fotoURL ? (
                        <img src={trabalhador.fotoURL} alt={trabalhador.nomeCompleto} />
                    ) : (
                        <User size={60} />
                    )}
                </div>
                <div className="trabalhador-info">
                    <span className="trabalhador-label">Trabalhador</span>
                    <h3 className="trabalhador-nome">{trabalhador.nomeCompleto}</h3>
                    <div className="trabalhador-docs">
                        <span><strong>CPF:</strong> {formatarDocumento(trabalhador.cpf, 'cpf')}</span>
                        <span><strong>RG:</strong> {formatarDocumento(trabalhador.rg, 'rg')}</span>
                    </div>
                </div>
            </section>

            <section className="cartao-os-secao">
                <h4><Briefcase size={14} /> Detalhes da Operação</h4>
                <div className="detalhe-item-cartao-os">
                    <span className="detalhe-label">LOCAL DE APRESENTAÇÃO</span>
                    <p>{solicitacao.local || 'Não informado'}</p>
                </div>
                <div className="detalhe-item-cartao-os">
                    <span className="detalhe-label">DESCRIÇÃO DO SERVIÇO</span>
                    <p>{solicitacao.descricaoServico || 'Não informado'}</p>
                </div>
            </section>

            <section className="cartao-os-secao">
                <h4><Info size={14} /> Requisitos e Equipamentos (EPIs)</h4>
                <p className="requisitos-texto-cartao-os">{solicitacao.requisitos || 'Nenhum requisito específico.'}</p>
            </section>

            {solicitacao.advertencia && (
                <section className="cartao-os-secao advertencia">
                    <h4><AlertTriangle size={14} /> Advertência Importante</h4>
                    <p>{solicitacao.advertencia}</p>
                </section>
            )}
            
            <footer className="cartao-os-footer">
                <div className="qr-code-placeholder">
                    <span>QR CODE</span>
                </div>
                <div className="plataforma-info">
                    <span>Operação gerenciada pela</span>
                    <p>Plataforma Chapa Amigo</p>
                </div>
            </footer>
        </div>
    );
}

// ALTERADO
export default CartaoOS;