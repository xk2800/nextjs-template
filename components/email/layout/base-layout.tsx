import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from '@react-email/components';

interface EmailTemplateProps {
  firstName: string;
}

export function EmailTemplate({ firstName }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '5px', padding: '24px' }}>
            <Heading style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              Welcome, {firstName}!
            </Heading>
            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#525252' }}>
              Thank you for testing the email functionality. This is a test email sent from your Next.js application.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}