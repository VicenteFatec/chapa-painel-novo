import React, { useState, useEffect } from 'react';
import './SolicitacoesPage.css';
import Modal from '../components/Modal';
import CartaoOS from '../components/CartaoOS'; // ALTERADO
import { Clock, CheckCircle, XCircle, FileText, User, Contact } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, orderBy, doc, writeBatch, Timestamp, getDoc } from 'firebase/firestore';

const getStatusInfo = (status) => { /* ...código sem alterações... */ };
const formatarMoeda = (valor) => { /* ...código sem alterações... */ };

function SolicitacoesPage() {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
    const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
    const [trabalhadoresSugeridos, setTrabalhadoresSugeridos] = useState([]);
    const [isLoadingSugeridos, setIsLoadingSugeridos] = useState(false);
    // ALTERADO
    const [isCartaoOSModalOpen, setIsCartaoOSModalOpen] = useState(false);
    const [trabalhadorParaCartaoOS, setTrabalhadorParaCartaoOS] = useState(null);

    const fetchSolicitacoes = async () => { /* ...código sem alterações... */ };
    useEffect(() => { fetchSolicitacoes(); }, []);
    const buscarTrabalhadoresCompativeis = async (regiaoDaSolicitacao) => { /* ...código sem alterações... */ };
    const handleVerDetalhes = (solicitacao) => { /* ...código sem alterações... */ };
    const fecharDetalhesModal = () => { /* ...código sem alterações... */ };
    const handleAlocarChapa = async (chapa) => { /* ...código sem alterações... */ };
    const handleFinalizarServico = async (solicitacao) => { /* ...código sem alterações... */ };
    
    // ALTERADO
    const handleAbrirCartaoOS = async (solicitacao) => {
        if (!solicitacao.chapaAlocadoId) {
            alert("Ainda não há trabalhador alocado para gerar o Cartão OS.");
            return;
        }
        setSolicitacaoSelecionada(solicitacao);
        try {
            const chapaDocRef = doc(db, "chapas_b2b", solicitacao.chapaAlocadoId);
            const chapaDoc = await getDoc(chapaDocRef);
            if (chapaDoc.exists()) {
                setTrabalhadorParaCartaoOS(chapaDoc.data());
                setIsCartaoOSModalOpen(true);
            } else {
                alert("Erro: não foi possível encontrar os dados do trabalhador alocado.");
            }
        } catch (error) {
            console.error("Erro ao buscar dados do chapa para o Cartão OS:", error);
            alert("Ocorreu um erro ao buscar os dados do trabalhador.");
        }
    };

    // ALTERADO
    const fecharCartaoOSModal = () => {
        setIsCartaoOSModalOpen(false);
        setSolicitacaoSelecionada(null);
        setTrabalhadorParaCartaoOS(null);
    };
    return (
        <div>
            <div className="solicitacoes-header">
                <h1 className="solicitacoes-title">Mesa de Operações</h1>
                <p className="solicitacoes-subtitle">Visão geral de todas as solicitações de serviço dos clientes.</p>
            </div>

            <div className="table-container">
                <table className="solicitacoes-table">
                    <thead> <tr> <th>Cliente / Trabalhador Alocado</th> <th>Datas</th> <th>Status</th> <th>Ações</th> </tr> </thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan="4" style={{ textAlign: 'center' }}>Carregando...</td></tr>) 
                        : solicitacoes.length > 0 ? (solicitacoes.map((solicitacao) => {
                            const statusInfo = getStatusInfo(solicitacao.status);
                            return (
                                <tr key={solicitacao.id}>
                                    <td> <div style={{fontWeight: 600}}>{solicitacao.cliente}</div> {solicitacao.chapaAlocadoNome && (<div style={{fontSize: '0.8rem', color: '#6b7280', marginTop: '4px'}}> <span style={{fontWeight: 500}}>Alocado:</span> {solicitacao.chapaAlocadoNome} </div>)} </td>
                                    <td> <div className="datas-cell"> <span><strong>Solicitado:</strong> {solicitacao.dataSolicitacao.toDate().toLocaleDateString('pt-BR')}</span> {solicitacao.dataFinalizacao && (<span><strong>Finalizado:</strong> {solicitacao.dataFinalizacao.toDate().toLocaleDateString('pt-BR')}</span>)} </div> </td>
                                    <td> <div className={`status-cell ${statusInfo.color}`}> {statusInfo.icon} <span>{statusInfo.text}</span> </div> </td>
                                    <td className="actions-cell">
                                        {solicitacao.status === 'pendente' && (<button className="view-details-button" onClick={() => handleVerDetalhes(solicitacao)}>Fazer Curadoria</button>)}
                                        {solicitacao.status === 'confirmado' && (<> <button className="finish-button" onClick={() => handleFinalizarServico(solicitacao)}>Finalizar</button> <button className="passaporte-button" onClick={() => handleAbrirCartaoOS(solicitacao)} title="Ver Cartão OS"><Contact size={16}/></button> </>)}
                                        {(solicitacao.status === 'finalizado' || solicitacao.status === 'cancelado') && (<> <button className="view-details-button" onClick={() => handleVerDetalhes(solicitacao)}>Ver Detalhes</button> <button className="passaporte-button" onClick={() => handleAbrirCartaoOS(solicitacao)} title="Ver Cartão OS"><Contact size={16}/></button> </>)}
                                    </td>
                                </tr>
                            );
                        })) : (<tr><td colSpan="4" style={{ textAlign: 'center' }}>Nenhuma solicitação encontrada.</td></tr>)}
                    </tbody>
                </table>
            </div>
            
            {/* Modal de Detalhes da Curadoria (sem alterações) */}
            {isDetalhesModalOpen && solicitacaoSelecionada && (
                <Modal isOpen={isDetalhesModalOpen} onClose={fecharDetalhesModal} title={`Detalhes da Solicitação: ${solicitacaoSelecionada.cliente}`}>
                     {/* ...código interno do modal de curadoria... */}
                </Modal>
            )}

            {/* ALTERADO: Modal para exibir o CartaoOS */}
            <Modal isOpen={isCartaoOSModalOpen} onClose={fecharCartaoOSModal} title="Cartão de Ordem de Serviço">
                <CartaoOS solicitacao={solicitacaoSelecionada} trabalhador={trabalhadorParaCartaoOS} />
            </Modal>
        </div>
    );
}

export default SolicitacoesPage;