import React, { useState, useEffect } from 'react';
import './SolicitacoesPage.css';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const getStatusInfo = (status) => {
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
                      <button className="view-details-button">
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
    </div>
  );
}

export default SolicitacoesPage;