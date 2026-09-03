import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  User, 
  Wrench, 
  Camera, 
  Plus, 
  Trash2, 
  Printer, 
  Check,
  ShieldCheck,
  Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './App.css';



function App() {
  // General Info
  const [activeTab, setActiveTab] = useState('nota');
  const [date, setDate] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [plates, setPlates] = useState('');
  const [motivoIngreso, setMotivoIngreso] = useState('');
  const [estadoEntrega, setEstadoEntrega] = useState('');
  const [client, setClient] = useState('');
  const [technician, setTechnician] = useState('');

  // Bike Info
  const [bikeMake, setBikeMake] = useState('');
  const [bikeYear, setBikeYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [gasTank, setGasTank] = useState('');
  const [bikeImage, setBikeImage] = useState(null);
  const fileInputRef = useRef(null);

  // Concept & Checklist
  const [conceptTitle, setConceptTitle] = useState('');
  const [bullets, setBullets] = useState([
    { id: 1, text: '' }
  ]);

  const addBullet = () => {
    const newId = bullets.length > 0 ? Math.max(...bullets.map(b => b.id)) + 1 : 1;
    setBullets([...bullets, { id: newId, text: '' }]);
  };

  const updateBullet = (id, text) => {
    setBullets(bullets.map(b => b.id === id ? { ...b, text } : b));
  };

  const removeBullet = (id) => {
    setBullets(bullets.filter(b => b.id !== id));
  };

  // Supplies
  const [supplies, setSupplies] = useState([
    { id: 1, name: '', qty: '', price: '', total: '' }
  ]);

  // Observations
  const [observations, setObservations] = useState("");
  const [labor, setLabor] = useState('');

  // Derived values
  const suppliesTotal = supplies.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const grandTotal = (parseFloat(labor) || 0) + suppliesTotal;

  // Handlers
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBikeImage(url);
    }
  };

  const addSupplyRow = () => {
    const newId = supplies.length > 0 ? Math.max(...supplies.map(s => s.id)) + 1 : 1;
    setSupplies([...supplies, { id: newId, name: '', qty: '', price: '', total: '' }]);
  };

  const removeSupplyRow = (id) => {
    setSupplies(supplies.filter(s => s.id !== id));
  };

  const updateSupply = (id, field, value) => {
    setSupplies(supplies.map(s => {
      if (s.id === id) {
        const updated = { ...s, [field]: value };
        if (field === 'price') {
          const numQty = parseFloat(updated.qty) || 1;
          updated.total = value === '' ? '' : parseFloat(value) * numQty;
        } else if (field === 'qty') {
          const numQty = parseFloat(value) || 1;
          updated.total = updated.price === '' ? '' : parseFloat(updated.price) * numQty;
        } else if (field === 'total') {
            updated.total = value;
        }
        return updated;
      }
      return s;
    }));
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  const isFormValid = () => {
    return date && orderNum && client && technician && bikeMake && bikeYear && 
           mileage && gasTank && conceptTitle && bullets.some(b => b.text.trim() !== '') &&
           plates && motivoIngreso && estadoEntrega;
  };

  const handleDownloadPDF = async () => {
    if (!isFormValid()) {
      alert('Por favor, llena todos los campos en ambas pestañas antes de descargar los PDFs.');
      return;
    }

    const notaElement = document.getElementById('nota-container');
    const constanciaElement = document.getElementById('constancia-container');
    
    if (!notaElement || !constanciaElement) return;

    const originalNotaDisplay = notaElement.style.display;
    const originalConstanciaDisplay = constanciaElement.style.display;

    // Forzar visibilidad temporal para que html2canvas pueda capturarlos
    notaElement.style.display = 'block';
    constanciaElement.style.display = 'block';

    const captureAndSave = async (element, nameSuffix) => {
      try {
        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: true,
          windowWidth: 1024,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById(element.id);
            if (clonedElement) {
               clonedElement.style.width = '850px';
               clonedElement.style.maxWidth = '850px';
               clonedElement.style.display = 'block';
            }
          },
          ignoreElements: (el) => el.classList.contains('no-print')
        });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        const pdfWidth = canvas.width;
        const pdfHeight = canvas.height;
        
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [pdfWidth, pdfHeight]
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${nameSuffix}.pdf`);
      } catch (error) {
        console.error('Error generating PDF for', nameSuffix, error);
      }
    };

    try {
      await captureAndSave(notaElement, `Nota_Servicio_${client.replace(/\s+/g, '_')}`);
      await captureAndSave(constanciaElement, `Constancia_${client.replace(/\s+/g, '_')}`);
    } finally {
      // Restaurar visibilidad
      notaElement.style.display = originalNotaDisplay;
      constanciaElement.style.display = originalConstanciaDisplay;
    }
  };

  return (
    <div className="app-wrapper">

      <div className="tabs-container no-print" style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '850px', marginBottom: '15px' }}>
        <button 
          onClick={() => setActiveTab('nota')}
          style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'nota' ? '#E31818' : '#e5e7eb', color: activeTab === 'nota' ? 'white' : '#4b5563' }}
        >
          Nota de Servicio
        </button>
        <button 
          onClick={() => setActiveTab('constancia')}
          style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'constancia' ? '#E31818' : '#e5e7eb', color: activeTab === 'constancia' ? 'white' : '#4b5563' }}
        >
          Constancia de Conformidad
        </button>
      </div>

      <div id="nota-container" className="document-container print-container" style={{ display: activeTab === 'nota' ? 'block' : 'none' }}>
        {/* HEADER */}
        <div className="header-banner">
          <div className="logo-section">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="JP Motors Logo" style={{ height: '65px', objectFit: 'contain' }} />
          </div>
          <div className="title-section">
            <div className="title-main">NOTA DE SERVICIO</div>
            <div className="title-sub">— TALLER ESPECIALIZADO DE MOTOS</div>
          </div>
        </div>

        {/* INFO GRID */}
        <div className="row g-3 mb-4 mt-md-0 mt-3" style={{ padding: '0 20px' }}>
          {/* Col 1 */}
          <div className="col-12 col-md-4">
            <div className="info-column h-100">
            <div className="info-item">
              <Calendar className="info-icon" size={24} />
              <div className="info-text">
                <span className="info-label">Fecha</span>
                <input type="text" className="input-field info-value" value={date} onChange={e => setDate(e.target.value)} placeholder="DD MES AÑO" />
              </div>
            </div>
            <div className="info-item">
              <FileText className="info-icon" size={24} />
              <div className="info-text">
                <span className="info-label">N° Orden</span>
                <input type="text" className="input-field info-value" value={orderNum} onChange={e => setOrderNum(e.target.value)} placeholder="JP-0000" />
              </div>
            </div>
            <div className="info-item">
              <User className="info-icon" size={24} />
              <div className="info-text">
                <span className="info-label">Cliente</span>
                <input type="text" className="input-field info-value" value={client} onChange={e => setClient(e.target.value)} placeholder="Nombre del cliente" />
              </div>
            </div>
            <div className="info-item">
              <Wrench className="info-icon" size={24} />
              <div className="info-text">
                <span className="info-label">Técnico</span>
                <input type="text" className="input-field info-value" value={technician} onChange={e => setTechnician(e.target.value)} />
              </div>
            </div>
          </div>
          </div>

          {/* Col 2 - Image */}
          <div className="col-12 col-md-4">
            <div className="bike-image-container h-100" onClick={() => fileInputRef.current?.click()}>
            {bikeImage ? (
              <img src={bikeImage} alt="Moto" className="bike-image" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9ca3af' }}>
                <Camera size={40} />
                <span style={{ fontSize: '12px', marginTop: '8px' }}>Toca para añadir foto</span>
              </div>
            )}
            <div className="image-overlay no-print">
              <Camera size={32} />
              <span style={{ fontSize: '12px', marginTop: '4px' }}>Cambiar foto</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="file-input-hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>
          </div>

          {/* Col 3 - Bike Details */}
          <div className="col-12 col-md-4">
            <div className="info-column h-100" style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '20px' }}>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ color: '#E31818', fontFamily: 'Outfit', fontWeight: 800, fontSize: '20px', fontStyle: 'italic', width: '100%', padding: 0 }} 
                  value={bikeMake} 
                  onChange={e => setBikeMake(e.target.value)}
                  placeholder="MARCA / MOTO"
                />
             </div>
             
             <div>
                <div className="info-label">Modelo</div>
                <input type="text" className="input-field info-value" value={bikeYear} onChange={e => setBikeYear(e.target.value)} />
             </div>
             
             <div style={{ marginTop: '10px' }}>
                <div className="info-label">Placas</div>
                <input type="text" className="input-field info-value" value={plates} onChange={e => setPlates(e.target.value)} placeholder="Ej. 29KMC9" />
             </div>

             <div className="info-item" style={{ marginTop: '10px' }}>
                <div className="info-icon" style={{ border: '2px solid', borderRadius: '50%', padding: '2px' }}><div style={{width: 14, height: 14, borderRadius: '50%', borderTop: '2px solid'}}></div></div>
                <div className="info-text">
                  <span className="info-label">Kilometraje</span>
                  <input type="text" className="input-field info-value" value={mileage} onChange={e => setMileage(e.target.value)} />
                </div>
             </div>

             <div className="info-item" style={{ marginTop: '10px' }}>
                <div className="info-icon" style={{ border: '2px solid', padding: '2px 4px', borderRadius: '2px' }}>⛽</div>
                <div className="info-text">
                  <span className="info-label">Tanque de Gas</span>
                  <input type="text" className="input-field info-value" value={gasTank} onChange={e => setGasTank(e.target.value)} />
                </div>
             </div>
            </div>
          </div>
        </div>

        {/* SERVICE CONCEPT */}
        <div className="service-concept">
          <div className="concept-header">
            <div className="concept-icon-box">
              <Wrench size={20} />
            </div>
            <div className="concept-title" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <span className="concept-title-label">CONCEPTO</span>
              <input 
                type="text"
                className="input-field concept-title-main"
                value={conceptTitle}
                onChange={e => setConceptTitle(e.target.value)}
                style={{ textTransform: 'uppercase', width: '100%', fontWeight: 'bold' }}
                placeholder="EJ. SERVICIO GENERAL Y REPARACIÓN"
              />
            </div>
          </div>

          <div className="checklist-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '15px' }}>
            {bullets.map((bullet) => (
              <div key={bullet.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '18px', lineHeight: '1.2' }}>•</span>
                <textarea 
                  className="input-field" 
                  style={{ width: '100%', minHeight: '30px', resize: 'vertical' }}
                  value={bullet.text}
                  onChange={e => updateBullet(bullet.id, e.target.value)}
                  placeholder="Descripción del trabajo o problema..."
                />
                <button className="no-print" style={{ color: '#ef4444', background: 'none', padding: '6px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} onClick={() => removeBullet(bullet.id)}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          <button className="add-row-btn no-print" style={{ margin: '0 15px 15px 15px', width: 'max-content' }} onClick={addBullet}>
            <Plus size={14} /> Agregar Puntos
          </button>
        </div>

        {/* SUPPLIES TABLE */}
        <div className="supplies-section">
          <div className="section-header-box">
            <div style={{ width: 16, height: 16, border: '2px solid #374151', borderRadius: '2px' }}></div>
            INSUMOS UTILIZADOS
          </div>
          <div className="table-responsive-mobile">
            <table className="table-custom">
              <thead>
              <tr>
                <th className="col-num">#</th>
                <th className="col-icon no-print"></th>
                <th>INSUMO</th>
                <th className="col-qty">CANTIDAD APROX.</th>
                <th className="col-price">PRECIO UNITARIO</th>
                <th className="col-total">IMPORTE</th>
                <th className="col-icon no-print"></th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((item, index) => (
                <tr key={item.id} className="supply-row-mobile">
                  <td className="col-num" data-label="Nº">{index + 1}</td>
                  <td className="col-icon no-print hide-mobile">
                     {/* Could add icons here if needed */}
                     <Wrench size={14} />
                  </td>
                  <td data-label="INSUMO">
                    <input type="text" className="table-input" value={item.name} onChange={e => updateSupply(item.id, 'name', e.target.value)} placeholder="Descripción del insumo" />
                  </td>
                  <td className="col-qty" data-label="CANTIDAD APROX.">
                    <input type="text" className="table-input text-center text-md-left" value={item.qty} onChange={e => updateSupply(item.id, 'qty', e.target.value)} placeholder="0" />
                  </td>
                  <td className="col-price" data-label="PRECIO UNITARIO">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#9ca3af', marginRight: '2px' }}>$</span>
                      <input type="number" className="table-input" value={item.price} onChange={e => updateSupply(item.id, 'price', e.target.value)} placeholder="0.00" />
                    </div>
                  </td>
                  <td className="col-total" data-label="IMPORTE">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#9ca3af', marginRight: '2px' }}>$</span>
                      <input type="number" className="table-input" value={item.total} onChange={e => updateSupply(item.id, 'total', e.target.value)} placeholder="0.00" />
                    </div>
                  </td>
                  <td className="col-icon no-print action-cell">
                    <button onClick={() => removeSupplyRow(item.id)} className="btn-delete-mobile" style={{ color: '#ef4444', background: 'none' }}><Trash2 size={16} /><span className="d-md-none ms-2">Eliminar Insumo</span></button>
                  </td>
                </tr>
              ))}
              <tr className="footer-row-mobile">
                <td colSpan="5" className="text-right table-footer hide-mobile">TOTAL INSUMOS</td>
                <td className="col-total table-footer" data-label="TOTAL INSUMOS">{formatCurrency(suppliesTotal)}</td>
                <td className="no-print hide-mobile"></td>
              </tr>
            </tbody>
          </table>
          </div>
          <button className="add-row-btn no-print mt-2" onClick={addSupplyRow}>
            <Plus size={14} /> Agregar Insumo
          </button>
        </div>

        {/* BOTTOM SECTION */}
        <div className="bottom-section row g-4" style={{ margin: '0 20px', paddingBottom: '20px' }}>
          <div className="col-12 col-md-7">
            <div className="observations-box h-100">
              <div className="obs-title">OBSERVACIONES</div>
            <textarea 
              className="obs-textarea" 
              value={observations} 
              onChange={e => setObservations(e.target.value)}
              placeholder="Escribe las observaciones aquí..."
            ></textarea>
            </div>
          </div>

          <div className="col-12 col-md-5">
            <div className="totals-box h-100">
              <div className="total-row">
              <span className="total-label">MANO DE OBRA</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <span style={{ fontWeight: 600, marginRight: '2px' }}>$</span>
                 <input type="number" className="table-input text-right" style={{ width: '80px', fontWeight: 600, fontSize: '14px' }} value={labor} onChange={e => setLabor(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="total-row">
              <span className="total-label">INSUMOS</span>
              <span className="total-val">{formatCurrency(suppliesTotal)}</span>
            </div>
            <div className="total-row-grand">
              <span className="total-label">TOTAL GENERAL</span>
              <span className="total-val">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="tax-note">PRECIOS EN MXN &nbsp; &nbsp; IVA INCLUIDO</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="trust-badge">
            <div className="badge-icon">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div className="trust-text">
              <span className="trust-t1">GRACIAS POR CONFIAR EN</span>
              <span className="trust-t2">JP MOTORS</span>
              <span className="trust-t3">CALIDAD, RENDIMIENTO Y CONFIANZA</span>
            </div>
          </div>

          <div className="logo-footer" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="JP Motors Logo" style={{ height: '45px', objectFit: 'contain' }} />
          </div>

          <div className="signature-box">
             <div className="sig-line"></div>
             <div className="sig-name">{technician || 'Técnico'}</div>
             <div className="sig-title">TÉCNICO RESPONSABLE</div>
          </div>
        </div>

      </div>

      <div id="constancia-container" className="document-container print-container" style={{ display: activeTab === 'constancia' ? 'block' : 'none', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
          
          <div style={{ background: '#000', padding: '20px', textAlign: 'center', marginBottom: '15px' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="JP Motors" style={{ height: '100px' }} />
          </div>
          <h2 style={{ textAlign: 'center', margin: '0 0 5px 0', fontSize: '20px', textTransform: 'uppercase' }}>
            CONSTANCIA DE SERVICIO Y CONFORMIDAD DEL CLIENTE
          </h2>
          <div style={{ textAlign: 'center', color: '#666', fontSize: '12px', marginBottom: '20px' }}>
            JP MOTORS · Taller de Servicio y Mecánica de Motocicletas
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', width: '15%', fontWeight: 'bold', background: '#f9f9f9' }}>Vehículo</td>
                <td style={{ border: '1px solid #ddd', padding: '10px', width: '35%' }}>{bikeMake} {bikeYear}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px', width: '15%', fontWeight: 'bold', background: '#f9f9f9' }}>Placas</td>
                <td style={{ border: '1px solid #ddd', padding: '10px', width: '35%' }}>
                   <input type="text" className="table-input" style={{ width: '100%' }} value={plates} onChange={e => setPlates(e.target.value)} placeholder="Ej. 29KMC9 · CDMX" />
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold', background: '#f9f9f9' }}>Fecha</td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{date}</td>
                <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold', background: '#f9f9f9' }}>Cliente</td>
                <td style={{ border: '1px solid #ddd', padding: '10px' }}>{client}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginBottom: '20px' }}>
             <h3 style={{ color: '#b91c1c', fontSize: '15px', margin: '0 0 8px 0' }}>1. MOTIVO DE INGRESO</h3>
             <textarea 
               className="obs-textarea" 
               style={{ width: '100%', minHeight: '60px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
               value={motivoIngreso}
               onChange={e => setMotivoIngreso(e.target.value)}
               placeholder={`La motocicleta ${bikeMake || '...'} ingresó al taller debido a la presencia de...`}
             />
          </div>

          <div style={{ marginBottom: '20px' }}>
             <h3 style={{ color: '#b91c1c', fontSize: '15px', margin: '0 0 10px 0' }}>2. TRABAJOS REALIZADOS</h3>
             <div style={{ paddingLeft: '5px' }}>
               {bullets.map(b => (
                 b.text ? <div key={b.id} style={{ marginBottom: '8px', fontSize: '13px' }}>• {b.text}</div> : null
               ))}
               {bullets.every(b => !b.text) && <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '13px' }}>* Los trabajos se llenan automáticamente desde los puntos de la Nota de Servicio.</div>}
             </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
             <h3 style={{ color: '#b91c1c', fontSize: '15px', margin: '0 0 8px 0' }}>3. ESTADO Y FUNCIONAMIENTO AL MOMENTO DE LA ENTREGA</h3>
             <textarea 
               className="obs-textarea" 
               style={{ width: '100%', minHeight: '60px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
               value={estadoEntrega}
               onChange={e => setEstadoEntrega(e.target.value)}
               placeholder={`Una vez concluidos los trabajos, se realizó una verificación general...`}
             />
          </div>

          <div style={{ marginBottom: '20px' }}>
             <h3 style={{ color: '#b91c1c', fontSize: '15px', margin: '0 0 8px 0' }}>4. CONFORMIDAD DEL CLIENTE</h3>
             <p style={{ margin: '0 0 15px 0', fontSize: '13px', lineHeight: '1.6', textAlign: 'justify' }}>
                El cliente manifiesta que recibe la unidad descrita en el presente documento, habiendo sido informado de los trabajos realizados y del estado de funcionamiento de la motocicleta al momento de la entrega. Asimismo, declara su conformidad con los trabajos efectuados y recibe la unidad para su uso.
             </p>
             <p style={{ margin: 0, fontSize: '11px', color: '#555', textAlign: 'justify', lineHeight: '1.5' }}>
                <strong>Observación:</strong> La presente constancia acredita el estado de funcionamiento de la unidad al momento de la entrega, una vez concluidos y verificados los trabajos realizados. El cliente contará con un plazo de 7 días naturales posteriores a la entrega para manifestar cualquier anomalía, inconformidad o aclaración relacionada directamente con los trabajos efectuados. Transcurrido dicho plazo, cualquier falla o anomalía que se presente será sometida a un diagnóstico para determinar su origen y establecer si existe relación con los trabajos realizados previamente.
             </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '70px', padding: '0 20px' }} className="signatures-constancia">
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '10px', fontSize: '12px', color: '#555' }}>
                Firma del cliente
              </div>
            </div>
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '10px', fontSize: '12px', color: '#555' }}>
                Firma y sello de JP MOTORS
              </div>
            </div>
          </div>

        </div>


      <div className="no-print" style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '850px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button className="btn-primary" onClick={handleDownloadPDF}>
          <Download size={18} /> Descargar PDFs
        </button>
      </div>
    </div>
  );
}

export default App;
