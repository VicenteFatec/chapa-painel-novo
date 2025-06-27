import React, { useState, useEffect, useRef } from 'react';
import './GestaoDeTalentosPage.css';
import Modal from '../components/Modal';
import { PlusCircle, User, FileText, Star, Upload, Paperclip, Camera } from 'lucide-react';

// Importando o necessário do Firebase (db e o novo storage)
import { db, storage } from '../firebaseConfig'; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, orderBy, Timestamp, writeBatch, doc } from 'firebase/firestore';

// Importando as bibliotecas de terceiros
import Papa from 'papaparse';
import imageCompression from 'browser-image-compression';

const VALORES_INICIAIS_FORM = {
    nomeCompleto: '',
    cpf: '',
    rg: '',
    telefone: '',
    status: 'Disponível',
    fotoURL: '',
    dossieURL: '',
    dataNascimento: '',
};

function GestaoDeTalentosPage() {
  const [chapas, setChapas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(VALORES_INICIAIS_FORM);
  const [importStatus, setImportStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);
  const chapasCollectionRef = collection(db, "chapas_b2b");

  const fetchChapas = async () => {
    setIsLoading(true);
    try {
      const q = query(chapasCollectionRef, orderBy("dataImportacao", "desc"));
      const data = await getDocs(q);
      const chapasList = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setChapas(chapasList);
    } catch (error) {
      console.error("Erro ao buscar chapas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChapas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const abrirModal = () => {
    setFormData(VALORES_INICIAIS_FORM);
    setUploadProgress('');
    setIsModalOpen(true);
  };

  const fecharModal = () => setIsModalOpen(false);

  const parseBrazilianDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900 || year > 2100) return null;
    return new Date(year, month - 1, day);
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento || !(dataNascimento instanceof Date) || isNaN(dataNascimento)) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const m = hoje.getMonth() - dataNascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
    }
    return idade;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress('Comprimindo imagem...');
    const options = { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      setUploadProgress('Enviando imagem...');
      const storageRef = ref(storage, `fotos_chapas/${Date.now()}_${compressedFile.name}`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(prevState => ({ ...prevState, fotoURL: downloadURL }));
      setUploadProgress('Foto enviada com sucesso!');
    } catch (error) {
      console.error("Erro no upload da imagem: ", error);
      setUploadProgress('Erro ao enviar imagem.');
      alert(`Erro no upload da imagem: ${error.code}`);
    }
  };

  const handleDossieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress('Enviando dossiê...');
    try {
      const storageRef = ref(storage, `dossies_chapas/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(prevState => ({ ...prevState, dossieURL: downloadURL }));
      setUploadProgress('Dossiê enviado com sucesso!');
    } catch (error) {
      console.error("Erro no upload do dossiê: ", error);
      setUploadProgress('Erro ao enviar dossiê.');
      alert(`Erro no upload do dossiê: ${error.code}`);
    }
  };

  const handleSalvarChapa = async (e) => {
    e.preventDefault();
    if (!formData.nomeCompleto) {
      alert('O nome completo é obrigatório.');
      return;
    }
    setUploadProgress('Salvando dados...');
    try {
      const dataNascimentoDate = parseBrazilianDate(formData.dataNascimento);
      const dadosParaSalvar = {
        nomeCompleto: formData.nomeCompleto,
        cpf: formData.cpf,
        rg: formData.rg,
        telefone: formData.telefone,
        status: formData.status,
        fotoURL: formData.fotoURL,
        dossieURL: formData.dossieURL,
        dataNascimento: dataNascimentoDate,
        idade: calcularIdade(dataNascimentoDate),
        dataImportacao: Timestamp.now(),
        regiao: getRegionFromDDD(formData.telefone)
      };
      await addDoc(chapasCollectionRef, dadosParaSalvar);
      fecharModal();
      fetchChapas();
    } catch (error) {
      console.error("Erro ao adicionar chapa: ", error);
      alert("Ocorreu um erro ao salvar. Tente novamente.");
    } finally {
      setUploadProgress('');
    }
  };
  
  const dddToRegionMap = { '11': 'São Paulo (Capital)', '12': 'São José dos Campos', '13': 'Santos', '14': 'Bauru', '15': 'Sorocaba', '16': 'Ribeirão Preto', '17': 'São José do Rio Preto', '18': 'Presidente Prudente', '19': 'Campinas', '21': 'Rio de Janeiro (Capital)', '22': 'Campos dos Goytacazes', '24': 'Volta Redonda', '31': 'Belo Horizonte', '32': 'Juiz de Fora', '34': 'Uberlândia', '35': 'Poços de Caldas', '38': 'Montes Claros', '51': 'Porto Alegre', '54': 'Caxias do Sul', '41': 'Curitiba', '43': 'Londrina', '45': 'Foz do Iguaçu' };
  
  const getRegionFromDDD = (phone) => {
    if (!phone || typeof phone !== 'string' || phone.length < 4) return 'Não identificado';
    const ddd = phone.substring(2, 4);
    return dddToRegionMap[ddd] || 'Outra Região';
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus('Lendo arquivo...');
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        setImportStatus(`Arquivo lido. Encontrados ${results.data.length} registros. Processando...`);
        const chapasParaImportar = [];
        for (const row of results.data) {
          if (row.Encargo && row.Encargo.toLowerCase() === 'chapa') {
            const dataNascimento = parseBrazilianDate(row['Data de Nascimento']);
            chapasParaImportar.push({
              nomeCompleto: row.Proprietário || '', cpf: row.CPF || '', rg: row.RG || '', telefone: row.Telefone || '', status: 'Disponível', regiao: getRegionFromDDD(row.Telefone || ''), dataInicioContrato: parseBrazilianDate(row['Data de início']) || null, dataFimContrato: parseBrazilianDate(row['Data de término']) || null, temRelatorio: (row.Relatorio || '').toLowerCase() === 'sim', dataNascimento: dataNascimento || null, idade: calcularIdade(dataNascimento), dataImportacao: Timestamp.now(), fotoURL: '', dossieURL: '',
            });
          }
        }
        if (chapasParaImportar.length === 0) { setImportStatus('Nenhum "Chapa" encontrado na planilha para importar.'); return; }
        try {
          setImportStatus(`Enviando ${chapasParaImportar.length} Chapas para o banco de dados...`);
          const batch = writeBatch(db);
          chapasParaImportar.forEach((chapa) => {
            const docRef = doc(collection(db, "chapas_b2b"));
            batch.set(docRef, chapa);
          });
          await batch.commit();
          setImportStatus(`Importação concluída com sucesso! ${chapasParaImportar.length} Chapas adicionados.`);
          fetchChapas();
        } catch (error) {
          console.error("Erro ao importar em lote: ", error);
          setImportStatus('Erro ao salvar no banco de dados. Verifique o console.');
        }
      }
    });
  };

  const triggerFileImport = () => { fileInputRef.current.click(); };

  // NOSSA NOVA FUNÇÃO DE TESTE
  const handleStorageTest = async () => {
    alert("Iniciando teste de conexão com o Storage...");
    try {
      const testFileContent = 'Se este arquivo for criado, a conexão funciona!';
      const testFileBlob = new Blob([testFileContent], { type: 'text/plain' });
      const storageRef = ref(storage, `testes_de_conexao/teste-${Date.now()}.txt`);
      await uploadBytes(storageRef, testFileBlob);
      alert("SUCESSO! A conexão com o Firebase Storage está funcionando perfeitamente!");
    } catch (error) {
      console.error("ERRO NO TESTE DE STORAGE:", error);
      alert(`O teste falhou. Erro: ${error.code} - ${error.message}`);
    }
  };
  
  return (
    <div>
      <div className="gestao-header">
        <div>
          <h1 className="gestao-title">Gestão de Talentos (Vitrine B2B)</h1>
          <p className="gestao-subtitle">Adicione e gerencie os Chapas de elite disponíveis para seus clientes.</p>
          {/* BOTÃO DE TESTE ADICIONADO AQUI */}
          <button onClick={handleStorageTest} style={{marginTop: '10px', background: 'orange', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
            Testar Conexão Storage
          </button>
        </div>
        <div className="action-buttons-group">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} />
          <button className="import-button-csv" onClick={triggerFileImport}>
            <Upload size={20} />
            Importar via Planilha
          </button>
          <button className="import-button" onClick={abrirModal}>
            <PlusCircle size={20} />
            Adicionar Manualmente
          </button>
        </div>
      </div>
      
      {importStatus && <p className="import-status-feedback">{importStatus}</p>}

      <div className="table-container">
        <table className="talentos-table">
          <thead>
            <tr>
              <th>Chapa</th>
              <th>Status</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>Carregando talentos...</td></tr>
            ) : (
              chapas.map((chapa) => (
                <tr key={chapa.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {chapa.fotoURL ? <img src={chapa.fotoURL} alt={chapa.nomeCompleto} className="avatar-image"/> : <User size={18} />}
                      </div>
                      <span>{chapa.nomeCompleto}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${(chapa.status || 'disponível').toLowerCase().replace(/ /g,'-')}`}>
                      {chapa.status}
                    </span>
                  </td>
                  <td>{chapa.telefone}</td>
                  <td>
                    <button className="action-button-details" title="Ver Dossiê"><FileText size={18} /></button>
                    <button className="action-button-edit" title="Editar Perfil"><Star size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={fecharModal} title="Adicionar Novo Chapa à Vitrine">
        <form onSubmit={handleSalvarChapa} className="modal-form">
          <div className="input-group">
            <label htmlFor="nomeCompleto">Nome Completo</label>
            <input id="nomeCompleto" name="nomeCompleto" type="text" value={formData.nomeCompleto} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="cpf">CPF</label>
            <input id="cpf" name="cpf" type="text" value={formData.cpf} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="rg">RG</label>
            <input id="rg" name="rg" type="text" value={formData.rg} onChange={handleInputChange} />
          </div>
          <div className="input-group">
            <label htmlFor="telefone">Telefone</label>
            <input id="telefone" name="telefone" type="text" value={formData.telefone} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label htmlFor="dataNascimento">Data de Nascimento (DD/MM/AAAA)</label>
            <input id="dataNascimento" name="dataNascimento" type="text" placeholder="DD/MM/AAAA" value={formData.dataNascimento} onChange={handleInputChange} />
          </div>
          <div className="input-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleInputChange}>
              <option value="Disponível">Disponível</option>
              <option value="Em Serviço">Em Serviço</option>
              <option value="De Férias">De Férias</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </div>
          <div className="upload-section">
            <div className="upload-item">
                <label htmlFor="fotoUpload" className="upload-button">
                    <Camera size={18}/> {formData.fotoURL ? 'Alterar Foto' : 'Carregar Foto'}
                </label>
                <input id="fotoUpload" type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}}/>
                {formData.fotoURL && <img src={formData.fotoURL} alt="Preview" className="upload-preview"/>}
            </div>
            <div className="upload-item">
                <label htmlFor="dossieUpload" className="upload-button">
                    <Paperclip size={18}/> {formData.dossieURL ? 'Alterar Dossiê' : 'Carregar Dossiê'}
                </label>
                <input id="dossieUpload" type="file" accept=".pdf" onChange={handleDossieUpload} style={{display: 'none'}}/>
                {formData.dossieURL && <span className="upload-feedback">PDF Carregado</span>}
            </div>
          </div>
          
          {uploadProgress && <p className="upload-progress-feedback">{uploadProgress}</p>}

          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
             <button type="submit" className="add-button">Salvar Chapa</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default GestaoDeTalentosPage;