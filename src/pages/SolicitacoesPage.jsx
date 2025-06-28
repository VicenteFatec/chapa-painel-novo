import React, { useState, useEffect } from 'react';
import './SolicitacoesPage.css';
import Modal from '../components/Modal';
import { Clock, CheckCircle, XCircle, FileText, User, DollarSign, Percent, Briefcase } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, orderBy, doc, writeBatch, Timestamp } from 'firebase/firestore';

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

// Função para formatar valores como moeda
const formatarMoeda = (valor) => {
    if (typeof valor !== 'number') return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function SolicitacoesPage() {
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
    const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
    const [trabalhadoresSugeridos, setTrabalhadoresSugeridos] = useState([]);
    const [isLoadingSugeridos, setIsLoadingSugeridos] = useState(false);

    // Funções de busca e manipulação de dados... (sem alterações aqui)
    const fetchSolicitacoes = async () => { setIsLoading(true); try { const solicitacoesCollectionRef = collection(db, "solicitacoes"); const q = query(solicitacoesCollectionRef, orderBy("dataSolicitacao", "desc")); const data = await getDocs(q); const solicitacoesList = data.docs.map(doc => ({ ...doc.data(), id: doc.id })); setSolicitacoes(solicitacoesList); } catch (error) { console.error("Erro ao buscar solicitações: ", error); } finally { setIsLoading(false); } };
    useEffect(() => { fetchSolicitacoes(); }, []);
    const buscarTrabalhadoresCompativeis = async (regiaoDaSolicitacao) => { if (!regiaoDaSolicitacao) return; setIsLoadingSugeridos(true); setTrabalhadoresSugeridos([]); try { const chapasCollectionRef = collection(db, "chapas_b2b"); const q = query(chapasCollectionRef, where("regiao", "==", regiaoDaSolicitacao), where("status", "==", "Disponível")); const data = await getDocs(q); const chapasList = data.docs.map(doc => ({ ...doc.data(), id: doc.id })); setTrabalhadoresSugeridos(chapasList); } catch (error) { console.error("Erro ao buscar trabalhadores compatíveis:", error); } finally { setIsLoadingSugeridos(false); } };
    const handleVerDetalhes = (solicitacao) => { setSolicitacaoSelecionada(solicitacao); setIsDetalhesModalOpen(true); if (solicitacao.status === 'pendente') { buscarTrabalhadoresCompativeis(solicitacao.regiao); } };
    const fecharDetalhesModal = () => { setIsDetalhesModalOpen(false); setSolicitacaoSelecionada(null); setTrabalhadoresSugeridos([]); };
    const handleAlocarChapa = async (chapa) => { if (!solicitacaoSelecionada || !chapa) { alert("Erro: Solicitação ou trabalhador não selecionado."); return; } try { const batch = writeBatch(db); const solicitacaoRef = doc(db, "solicitacoes", solicitacaoSelecionada.id); batch.update(solicitacaoRef, { status: 'confirmado', chapaAlocadoId: chapa.id, chapaAlocadoNome: chapa.nomeCompleto, }); const chapaRef = doc(db, "chapas_b2b", chapa.id); batch.update(chapaRef, { status: 'Em Serviço' }); await batch.commit(); fecharDetalhesModal(); fetchSolicitacoes(); alert(`Trabalhador ${chapa.nomeCompleto} alocado com sucesso!`); } catch (error) { console.error("Erro ao alocar trabalhador: ", error); alert("Ocorreu um erro ao tentar alocar o trabalhador."); } };
    const handleFinalizarServico = async (solicitacao) => { if (!solicitacao.chapaAlocadoId) { alert("Erro: Não é possível finalizar um serviço sem um trabalhador alocado."); return; } if (!window.confirm(`Tem certeza que deseja finalizar este serviço e liberar o trabalhador ${solicitacao.chapaAlocadoNome}?`)) { return; } try { const batch = writeBatch(db); const solicitacaoRef = doc(db, "solicitacoes", solicitacao.id); batch.update(solicitacaoRef, { status: 'finalizado', dataFinalizacao: Timestamp.now() }); const chapaRef = doc(db, "chapas_b2b", solicitacao.chapaAlocadoId); batch.update(chapaRef, { status: 'Disponível' }); await batch.commit(); fetchSolicitacoes(); alert("Serviço finalizado com sucesso!"); } catch (error) { console.error("Erro ao finalizar serviço: ", error); alert("Ocorreu um erro ao tentar finalizar o serviço."); } };
    return (
        <div>
            <div className="solicitacoes-header">
                <h1 className="solicitacoes-title">Mesa de Operações</h1>
                <p className="solicitacoes-subtitle">Visão geral de todas as solicitações de serviço dos clientes.</p>
            </div>

            {/* A tabela principal não precisa de grandes alterações */}
            <div className="table-container">
                <table className="solicitacoes-table">
                    <thead> <tr> <th>Cliente / Trabalhador Alocado</th> <th>Datas</th> <th>Status</th> <th>Ações</th> </tr> </thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan="4" style={{ textAlign: 'center' }}>Carregando solicitações...</td></tr>) 
                        : solicitacoes.length > 0 ? (solicitacoes.map((solicitacao) => {
                            const statusInfo = getStatusInfo(solicitacao.status);
                            return (
                                <tr key={solicitacao.id}>
                                    <td> <div style={{fontWeight: 600}}>{solicitacao.cliente}</div> {solicitacao.chapaAlocadoNome && (<div style={{fontSize: '0.8rem', color: '#6b7280', marginTop: '4px'}}> <span style={{fontWeight: 500}}>Alocado:</span> {solicitacao.chapaAlocadoNome} </div>)} </td>
                                    <td> <div className="datas-cell"> <span><strong>Solicitado:</strong> {solicitacao.dataSolicitacao.toDate().toLocaleDateString('pt-BR')}</span> {solicitacao.dataFinalizacao && (<span><strong>Finalizado:</strong> {solicitacao.dataFinalizacao.toDate().toLocaleDateString('pt-BR')}</span>)} </div> </td>
                                    <td> <div className={`status-cell ${statusInfo.color}`}> {statusInfo.icon} <span>{statusInfo.text}</span> </div> </td>
                                    <td className="actions-cell">
                                        {solicitacao.status === 'pendente' && (<button className="view-details-button" onClick={() => handleVerDetalhes(solicitacao)}>Fazer Curadoria</button>)}
                                        {solicitacao.status === 'confirmado' && (<> <button className="finish-button" onClick={() => handleFinalizarServico(solicitacao)}>Finalizar</button> <button className="view-details-button-secondary" onClick={() => handleVerDetalhes(solicitacao)}>Detalhes</button> </>)}
                                        {(solicitacao.status === 'finalizado' || solicitacao.status === 'cancelado') && (<button className="view-details-button" onClick={() => handleVerDetalhes(solicitacao)}>Ver Detalhes</button>)}
                                    </td>
                                </tr>
                            );
                        })) : (<tr><td colSpan="4" style={{ textAlign: 'center' }}>Nenhuma solicitação encontrada.</td></tr>)}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE DETALHES TOTALMENTE REFORMULADO */}
            {solicitacaoSelecionada && (
                <Modal isOpen={isDetalhesModalOpen} onClose={fecharDetalhesModal} title={`Detalhes da Solicitação: ${solicitacaoSelecionada.cliente}`}>
                    <div className="curadoria-container">
                        <div className="curadoria-coluna">
                            {/* Bloco de Detalhes Gerais */}
                            <div className="detalhes-bloco">
                                <h4><Briefcase size={14} /> Detalhes Gerais</h4>
                                <div className="detalhes-solicitacao">
                                    <div className="detalhe-item"> <strong>Cliente:</strong> <p>{solicitacaoSelecionada.cliente}</p> </div>
                                    <div className="detalhe-item"> <strong>Local:</strong> <p>{solicitacaoSelecionada.local}</p> </div>
                                    <div className="detalhe-item"> <strong>Região:</strong> <p>{solicitacaoSelecionada.regiao}</p> </div>
                                    {solicitacaoSelecionada.chapaAlocadoNome && (<div className="detalhe-item"> <strong>Trabalhador Alocado:</strong> <p style={{fontWeight: 600, color: '#16a34a'}}>{solicitacaoSelecionada.chapaAlocadoNome}</p> </div>)}
                                </div>
                            </div>
                            
                            {/* Bloco de Detalhes Financeiros */}
                            <div className="detalhes-bloco">
                                <h4><DollarSign size={14} /> Detalhes Financeiros</h4>
                                <div className="detalhes-financeiro">
                                    <div className="valor-item bruto"> <strong>{formatarMoeda(solicitacaoSelecionada.valorServicoBruto)}</strong> <span>Valor Bruto</span> </div>
                                    <div className="valor-item comissao"> <strong>{solicitacaoSelecionada.percentualComissao || 0}%</strong> <span>Comissão</span> </div>
                                    <div className="valor-item liquido"> <strong>{formatarMoeda((solicitacaoSelecionada.valorServicoBruto || 0) * (1 - (solicitacaoSelecionada.percentualComissao || 0) / 100))}</strong> <span>Líquido Chapa</span> </div>
                                </div>
                            </div>

                            {/* Bloco de Detalhes Operacionais */}
                            <div className="detalhes-bloco">
                                <h4><FileText size={14} /> Detalhes Operacionais</h4>
                                <div className="detalhes-solicitacao">
                                    <div className="detalhe-item"> <strong>Descrição do Serviço:</strong> <p className="requisitos-texto">{solicitacaoSelecionada.descricaoServico || 'Não informado'}</p> </div>
                                    <div className="detalhe-item"> <strong>Requisitos (EPIs):</strong> <p className="requisitos-texto">{solicitacaoSelecionada.requisitos || 'Não informado'}</p> </div>
                                    {solicitacaoSelecionada.advertencia && (<div className="advertencia-bloco"> <p><strong>Atenção:</strong> {solicitacaoSelecionada.advertencia}</p> </div>)}
                                </div>
                            </div>
                        </div>

                        {/* Coluna da Direita: Só aparece se o status for 'pendente' */}
                        {solicitacaoSelecionada.status === 'pendente' && (
                            <div className="curadoria-coluna">
                                <h3>Trabalhadores Sugeridos</h3>
                                {isLoadingSugeridos ? (<p>Buscando...</p>) : (
                                    <div className="lista-sugeridos">
                                        {trabalhadoresSugeridos.length > 0 ? (trabalhadoresSugeridos.map(chapa => (
                                            <div key={chapa.id} className="sugerido-item">
                                                <div className="sugerido-info">
                                                    {chapa.fotoURL ? <img src={chapa.fotoURL} alt={chapa.nomeCompleto} className="sugerido-avatar" /> : <div className="user-avatar" style={{width: '40px', height: '40px'}}><User size={18} /></div>}
                                                    <span className="sugerido-nome">{chapa.nomeCompleto}</span>
                                                </div>
                                                <button className="alocar-btn" onClick={() => handleAlocarChapa(chapa)}>Alocar</button>
                                            </div>
                                        ))) : (<p style={{textAlign: 'center', padding: '1rem'}}>Nenhum trabalhador compatível encontrado.</p>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default SolicitacoesPage;