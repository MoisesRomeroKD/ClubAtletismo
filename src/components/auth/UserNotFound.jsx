export default function UserNotFound({ onRetry }) {
  return (
    <>
      <div style={{
        backgroundColor: '#EEEEEE',
        padding: '20px',
        margin: '0 auto 25px',
        width: '90%',
        clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
        display: 'flex',
        flexDirection: 'column', // Cambiado a columna para centrar mejor el icono y texto
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '150px',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
      }}>
        {/* Icono simple opcional */}
        <span style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</span>
        
        <p style={{ 
          color: '#333', 
          fontSize: '14px', 
          margin: '0 25px', 
          lineHeight: '1.6',
          fontWeight: '500' 
        }}>
          Su correo no está guardado. Es posible que no pertenezca al club 
          o el administrador aún no lo ha agregado. <b>Favor dirigirse a la oficina.</b>
        </p>
      </div>

      <button 
        onClick={onRetry} 
        style={{ 
          background: 'none',
          border: 'none',
          marginTop: '10px', 
          fontSize: '13px', 
          cursor: 'pointer', 
          color: '#0056b3', // Un azul más visible
          textDecoration: 'underline',
          fontWeight: 'bold'
        }}
        onMouseOver={(e) => e.target.style.color = '#003d80'}
        onMouseOut={(e) => e.target.style.color = '#0056b3'}
      >
        Volver a intentar
      </button>
    </>
  );
}