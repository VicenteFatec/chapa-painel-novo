import React, { useState, useEffect } from 'react';
import './SolicitacoesPage.css';
import Modal from '../components/Modal'; // Importando nosso modal reutilizável
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const getStatusInfo = (status) => {
    // ... (nenhuma mudança nesta função)
    switch (status) {
        case 'pendente':
            return { icon: <Clock size={16} />, text: 'Pendente de Curadoria', color: 'text-yellow-500' };
        case 'confirmado':
            return { icon: <CheckCircle size={16} />, text: 'Chapa Confirmado', color: 'text-green-500' };
        case 'finalizado':
            return { icon: <CheckCircle size={16} />, text: 'Serviço Finalizado', color: 'text-blue-500' };
        case 'cancelado':
            return { icon: <XCircle size={16} />, text: 'Cancelado', color: 'text-red-500' };
        default:
            return { icon: <FileText size={16} />, text: 'Status Desconhecido', color: 'text-gray-500' };
    }
};

function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // NOVO: Estados para o modal de detalhes
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);

  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const solicitacoesCollectionRef = collection(db, "solicitacoes");
        const q = query(solicitacoesCollectionRef, orderBy("dataSolicitacao", "desc"));
        const data = await getDocs(q);
        const solicitacoesList = data.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setSolicitacoes(solicitacoesList);
      } catch (error) {
        console.error("Erro ao buscar solicitações: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSolicitacoes();
  }, []);

  // NOVO: Função para abrir o modal e guardar os dados da solicitação clicada
  const handleVerDetalhes = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setIsDetalhesModalOpen(true);
  };

  // NOVO: Função para fechar o modal
  const fecharDetalhesModal = () => {
    setIsDetalhesModalOpen(false);
    setSolicitacaoSelecionada(null);
  };

  return (
    <div>
      <div className="solicitacoes-header">
        <h1 className="solicitacoes-title">Mesa de Operações</h1>
        <p className="solicitacoes-subtitle">Visão geral de todas as solicitações de serviço dos clientes.</p>
      </div>

      <div className="table-container">
        <table className="solicitacoes-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Local do Serviço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>Carregando dados...</td>
              </tr>
            ) : (
              solicitacoes.map((solicitacao) => {
                const statusInfo = getStatusInfo(solicitacao.status);
                return (
                  <tr key={solicitacao.id}>
                    <td>{solicitacao.cliente}</td>
                    <td>{solicitacao.local}</td>
                    <td>
                      <div className={`status-cell ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                      </div>
                    </td>
                    <td>
                      {/* ALTERADO: O botão agora chama a função para abrir o modal */}
                      <button className="view-details-button" onClick={() => handleVerDetalhes(solicitacao)}>
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* NOVO: Nosso modal de detalhes. Ele só aparece se uma solicitação for selecionada */}
      {solicitacaoSelecionada && (
        <Modal isOpen={isDetalhesModalOpen} onClose={fecharDetalhesModal} title="Detalhes da Solicitação">
          <div className="detalhes-solicitacao">
            <div className="detalhe-item">
              <strong>Cliente:</strong>
              <p>{solicitacaoSelecionada.cliente}</p>
            </div>
            <div className="detalhe-item">
              <strong>Local:</strong>
              <p>{solicitacaoSelecionada.local}</p>
            </div>
            <div className="detalhe-item">
              <strong>Data da Solicitação:</strong>
              {/* O '.toDate()' converte o formato do Firebase para um objeto de data do JS */}
              {/* O '.toLocaleString()' formata a data para um texto legível (ex: 27/06/2025, 14:30:00) */}
              <p>{solicitacaoSelecionada.dataSolicitacao.toDate().toLocaleString('pt-BR')}</p>
            </div>
            <div className="detalhe-item">
              <strong>Status:</strong>
              <p>{getStatusInfo(solicitacaoSelecionada.status).text}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SolicitacoesPage;