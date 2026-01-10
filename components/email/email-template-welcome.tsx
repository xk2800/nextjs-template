import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
} from '@react-email/components';

interface EmailTemplateWelcomeProps {
  firstName: string;
}

export function EmailTemplateWelcome({ firstName }: EmailTemplateWelcomeProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px' }}>
          <Section style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '40px', textAlign: 'center' as const }}>
            <Heading style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a' }}>
              Welcome aboard, {firstName}! 👋
            </Heading>
            <Text style={{ fontSize: '16px', color: '#666666', marginBottom: '32px', lineHeight: '24px' }}>
              We're thrilled to have you join us. Your account is all set up and ready to go.
            </Text>
            <Section style={{ marginBottom: '32px' }}>
              <Button
                href="https://example.com"
                style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  padding: '12px 32px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                Get Started
              </Button>
            </Section>
            <Text style={{ fontSize: '14px', color: '#999999', lineHeight: '20px' }}>
              Need help? Check out our <a href="https://example.com/docs" style={{ color: '#000000', textDecoration: 'underline' }}>documentation</a> or <a href="https://example.com/support" style={{ color: '#000000', textDecoration: 'underline' }}>contact support</a>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
