const Defacement = () => {
  return (
    <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-green-900/20 animate-pulse"></div>
      
      {/* Glitch effect overlay */}
      <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#ff0000_2px,#ff0000_4px)]"></div>
      
      <div className="relative z-10 text-center space-y-8 max-w-4xl">
        {/* Skull or warning icon */}
        <div className="text-8xl animate-bounce mb-8">⚠️</div>
        
        {/* Main defacement message */}
        <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-wider animate-pulse drop-shadow-[0_0_25px_rgba(255,0,0,0.8)]">
          HACKED
        </h1>
        
        <div className="border-t-4 border-b-4 border-red-500 py-6 my-8">
          <p className="text-2xl md:text-4xl font-mono uppercase tracking-wide">
            SISTEMA COMPROMETIDO
          </p>
        </div>
        
        {/* Academic disclaimer */}
        <div className="bg-red-950/50 border-2 border-red-500 p-6 rounded-lg backdrop-blur-sm">
          <p className="text-xl font-bold text-white mb-4">
            ⚠️ PAGINA HACKEADA POR LOS GABOTADOS ⚠️
          </p>
          <p className="text-sm text-gray-300">
            <br />
              GABOTADOS HERE
          </p>
        </div>
        
        {/* Simulated attack info */}
        <div className="grid md:grid-cols-2 gap-4 mt-8 text-left font-mono text-sm">
          <div className="bg-black/70 border border-red-500/50 p-4 rounded">
            <p className="text-green-400 mb-2">{'>'} VULNERABILIDAD EXPLOTADA:</p>
            <p className="text-gray-300">- Autenticación débil</p>
            <p className="text-gray-300">- SQL Injection</p>
            <p className="text-gray-300">- XSS (Cross-Site Scripting)</p>
          </div>
          
          <div className="bg-black/70 border border-red-500/50 p-4 rounded">
            <p className="text-green-400 mb-2">{'>'} VECTORES DE ATAQUE:</p>
            <p className="text-gray-300">- Fuerza bruta exitosa</p>
            <p className="text-gray-300">- Bypass de validación</p>
            <p className="text-gray-300">- Escalación de privilegios</p>
          </div>
        </div>
        
        {/* Simulated terminal output */}
        <div className="bg-black border-2 border-green-500 p-4 rounded-lg text-left font-mono text-xs md:text-sm overflow-hidden">
          <p className="text-green-400">root@attacker:~# nmap -sV 192.168.1.100</p>
          <p className="text-gray-400">Starting Nmap scan...</p>
          <p className="text-green-400">PORT     STATE SERVICE VERSION</p>
          <p className="text-gray-300">80/tcp   open  http    nginx 1.18.0</p>
          <p className="text-gray-300">443/tcp  open  ssl/http nginx 1.18.0</p>
          <p className="text-red-400 animate-pulse">⚠️ VULNERABILITIES DETECTED ⚠️</p>
        </div>
        
        {/* Warning message */}
        <div className="text-yellow-400 text-lg font-semibold mt-8 animate-pulse">
          🔒 TODOS LOS DATOS HAN SIDO COMPROMETIDOS 🔒
        </div>
        
        {/* Return link for demonstration */}
        <div className="mt-12">
          <a 
            href="/" 
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 border-2 border-white"
          >
            RESTAURAR SISTEMA ORIGINAL
          </a>
        </div>
        
        {/* Timestamp */}
        <div className="text-gray-500 text-xs mt-8 font-mono">
          TIMESTAMP: {new Date().toISOString()} | IP: 192.168.1.XXX
        </div>
      </div>
      
      {/* Matrix-like falling effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 text-green-500 font-mono text-xs animate-pulse">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ 
              position: 'absolute', 
              left: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 5}s`,
              animation: 'fall 5s linear infinite'
            }}>
              {Math.random() > 0.5 ? '1' : '0'}
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes fall {
          0% { top: -20px; }
          100% { top: 100vh; }
        }
      `}</style>
    </div>
  );
};

export default Defacement;
