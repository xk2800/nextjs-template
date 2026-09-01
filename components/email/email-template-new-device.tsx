import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from '@react-email/components';

interface EmailTemplateNewDeviceProps {
  firstName: string;
  device: string;
  location: string;
  ipAddress: string;
  when: string;
}

export function EmailTemplateNewDevice({
  firstName,
  device,
  location,
  ipAddress,
  when,
}: EmailTemplateNewDeviceProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px' }}>
          <Section style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '40px' }}>
            <Heading style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a', textAlign: 'center' as const }}>
              New sign-in from an unrecognized device
            </Heading>
            <Text style={{ fontSize: '16px', color: '#666666', marginBottom: '24px', lineHeight: '24px' }}>
              Hi {firstName}, your account was just used to sign in from a device we haven&apos;t seen before.
            </Text>
            <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '20px' }}><strong>Device:</strong> {device}</Text>
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '20px' }}><strong>Approx. location:</strong> {location}</Text>
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '20px' }}><strong>IP address:</strong> {ipAddress}</Text>
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0', lineHeight: '20px' }}><strong>When:</strong> {when}</Text>
            </Section>
            <Text style={{ fontSize: '14px', color: '#666666', lineHeight: '22px' }}>
              If this was you, no action is needed. If you don&apos;t recognize it, change your password now and review your active sessions in your account settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
