import Link from 'next/link';

export default function Home(){
  return (
    <main style={{padding:20}}>
      <h1>Sofa King</h1>
      <p>Escolha seu modelo</p>
      <Link href="/produto/sofa-retratil">Ver sofá retrátil</Link>
    </main>
  )
}