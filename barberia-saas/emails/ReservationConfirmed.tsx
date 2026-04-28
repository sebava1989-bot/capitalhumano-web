import {
  Body, Container, Head, Heading, Html,
  Preview, Section, Text, Hr
} from '@react-email/components'

interface Props {
  clienteNombre: string
  servicio: string
  barbero: string
  fecha: string
  hora: string
  barberiaNombre: string
  precio: string
}

export function ReservationConfirmed({
  clienteNombre, servicio, barbero, fecha, hora, barberiaNombre, precio
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu reserva en {barberiaNombre} está confirmada</Preview>
      <Body style={{ backgroundColor: '#111111', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '500px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#e8c84a', fontSize: '24px' }}>
            ✅ Reserva confirmada
          </Heading>
          <Text style={{ color: '#aaaaaa' }}>Hola {clienteNombre},</Text>
          <Text style={{ color: '#ffffff' }}>Tu hora en <strong>{barberiaNombre}</strong> está confirmada:</Text>
          <Section style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px' }}>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Servicio: <span style={{ color: '#fff' }}>{servicio}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Barbero: <span style={{ color: '#fff' }}>{barbero}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Fecha: <span style={{ color: '#fff' }}>{fecha}</span></Text>
            <Text style={{ color: '#aaaaaa', margin: '4px 0' }}>Hora: <span style={{ color: '#fff' }}>{hora}</span></Text>
            <Hr style={{ borderColor: '#333' }} />
            <Text style={{ color: '#e8c84a', fontWeight: 'bold', margin: '4px 0' }}>Total: {precio}</Text>
          </Section>
          <Text style={{ color: '#666666', fontSize: '12px', marginTop: '24px' }}>
            Si necesitas cancelar, responde este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
