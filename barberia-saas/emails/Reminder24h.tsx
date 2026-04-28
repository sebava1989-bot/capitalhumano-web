import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'

interface Props {
  clienteNombre: string
  servicio: string
  barbero: string
  hora: string
  barberiaNombre: string
}

export function Reminder24h({ clienteNombre, servicio, barbero, hora, barberiaNombre }: Props) {
  return (
    <Html>
      <Head />
      <Preview>⏰ Recordatorio: tu cita en {barberiaNombre} es mañana a las {hora}</Preview>
      <Body style={{ backgroundColor: '#111111', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '500px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#e8c84a' }}>⏰ Tu cita es mañana</Heading>
          <Text style={{ color: '#ffffff' }}>Hola {clienteNombre}, te recordamos:</Text>
          <Section style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Servicio: <span style={{ color: '#fff' }}>{servicio}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Barbero: <span style={{ color: '#fff' }}>{barbero}</span></Text>
            <Text style={{ color: '#e8c84a', fontWeight: 'bold', margin: '4px 0' }}>Hora: {hora}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
