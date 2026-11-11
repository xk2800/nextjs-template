import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from '@react-email/components';

interface EmailTemplate2Props {
  firstName: string;
}

export function EmailTemplate2({ firstName }: EmailTemplate2Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Heading style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
              Hello {firstName},
            </Heading>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              This is your second template
            </Text>
            <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#374151', marginBottom: '16px' }}>
              This is an alternate email template with a different design and layout. You can customize this template with different content, styling, and structure to suit your needs.
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#374151' }}>
              Feel free to modify this template to match your brand and message.
            </Text>
          </Section>
          <Text style={{ fontSize: '12px', color: '#9ca3af', marginTop: '32px', textAlign: 'center' }}>
            © 2024 Your Company. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
