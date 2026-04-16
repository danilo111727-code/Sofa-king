'use client';
import { useState } from 'react';

export default function Produto(){
  const [medida,setMedida]=useState(0);
  const [espuma,setEspuma]=useState(0);
  const [tecido,setTecido]=useState(0);

  const precoBase=800;
  const preco = (precoBase+medida+espuma+tecido);

  const entrada = preco*0.5;

  function enviar(){
    const msg = `Pedido Sofa King

Valor total: R$ ${preco}
Entrada 50%: R$ ${entrada}

Restante na retirada ou vídeo.`;

    window.open(`https://wa.me/5599999999999?text=${encodeURIComponent(msg)}`)
  }

  return (
    <div style={{padding:20}}>
      <h2>Configurar sofá</h2>

      <h3>Medida</h3>
      <button onClick={()=>setMedida(300)}>2.00m</button>
      <button onClick={()=>setMedida(500)}>2.50m</button>

      <h3>Espuma</h3>
      <button onClick={()=>setEspuma(0)}>D28</button>
      <button onClick={()=>setEspuma(150)}>D33</button>

      <h3>Tecido</h3>
      <button onClick={()=>setTecido(200)}>Veludo</button>
      <button onClick={()=>setTecido(100)}>Suede</button>

      <h2>Total: R$ {preco}</h2>
      <h3>Entrada (50%): R$ {entrada}</h3>

      <button onClick={enviar}>
        Pagar 50% e iniciar
      </button>
    </div>
  )
}