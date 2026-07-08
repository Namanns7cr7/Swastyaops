'use client';

/**
 * Daily Executive Briefing Page — Newspaper-style editorial intelligence report.
 * Replaces hackathon gradients with clean typography, bilingual toggle, and TTS audio player.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import { briefing as enBriefing, district } from '@/lib/demo-data';
import PageHeader from '@/components/PageHeader';

// Hindi translation data
const hiBriefing = {
  date: 'आज · सुबह 06:42 बजे उत्पन्न',
  wordCount: 285,
  sections: [
    {
      heading: 'आवश्यक निर्णय',
      items: [
        { text: '1. सीएचसी फतेहपुर से पीएचसी लोसल में 40× ओआरएस स्थानांतरित करें — 12 जुलाई को संभावित स्टॉक-आउट; डोनर के पास 21 दिनों का स्टॉक सुरक्षित। 3 घंटे से लंबित।', link: '/approvals' },
        { text: '2. 3 स्वास्थ्य केंद्रों के लिए आपातकालीन जिंक ऑर्डर — 28 जुलाई के आरएमएससी चक्र से पहले कोई भी स्थानीय डोनर इस कमी को पूरा नहीं कर सकता। 26 घंटे से लंबित।', link: '/approvals' },
      ],
    },
    {
      heading: 'रातों-रात नए अपडेट',
      items: [
        { text: 'रींगस ब्लॉक में डायरिया का संकेत मजबूत: 3 जलग्रहण क्षेत्रों में मरीजों की संख्या बेसलाइन से 2.8σ ऊपर, मानसूनी वर्षा इस संकेत की पुष्टि करती है। आत्मविश्वास स्तर 0.72।', link: '/alerts' },
      ],
    },
    {
      heading: 'निगरानी सूची',
      items: [
        { text: 'सीएचसी फतेहपुर में 26 घंटे से 87% बेड भरे हुए हैं — निकटतम विकल्प सीएचसी लक्ष्मणगढ़ (12 खाली, 31 मिनट), जिला अस्पताल सीकर (47 खाली, 48 मिनट)।', link: '/alerts' },
        { text: 'सीएचसी खंडेला में 52 घंटे से हीमोग्लोबिन परीक्षण ठप; अभिकर्मक (reagent) मांग पत्र तैयार, निकटतम विकल्प पीएचसी पिपराली।', link: '/alerts' },
      ],
    },
    {
      heading: 'सुलझाए गए अलर्ट',
      items: [
        { text: 'पीएचसी रानोली में पैरासिटामोल सिरप का 90 दिनों का स्टॉक भरा गया; अलर्ट स्वचालित रूप से बंद।', link: '/alerts' },
      ],
    },
    {
      heading: 'जिला स्वास्थ्य स्थिति',
      items: [
        { text: '11:00 बजे तक 111 में से 96 केंद्रों ने रिपोर्ट किया; जिला स्वास्थ्य स्कोर 74 (रींगस सिग्नल के कारण कल की तुलना में −2)।', link: '/' },
      ],
    },
  ],
};

export default function BriefingsPage() {
  const theme = useTheme();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const briefing = lang === 'en' ? enBriefing : hiBriefing;

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleAudioToggle = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);

      const textToSpeak = briefing.sections
        .map((s) => {
          const itemsText = s.items.map((item) => item.text).join('. ');
          return `${s.heading}: ${itemsText}`;
        })
        .join('. ');

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
      utterance.rate = 0.95;

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find((v) =>
          v.lang.toLowerCase().replace('_', '-').startsWith(lang === 'en' ? 'en' : 'hi')
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1080, mx: 'auto' }}>
      <PageHeader
        title={lang === 'en' ? 'Daily Executive Briefing' : 'दैनिक कार्यकारी संक्षिप्त विवरण'}
        subtitle={`District ${district.name} · ${briefing.date} · ${briefing.wordCount} words. Synthesized from BigQuery overnight batch logs and Vertex AI predictive disease surveillance.`}
        badge={<Chip size="small" icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />} label="Executive Briefing Agent" color="primary" sx={{ fontWeight: 700 }} />}
      />

      {/* Control & Audio Toolbar */}
      <Card
        sx={{
          p: 2,
          mb: 4,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mr: 0.5, textTransform: 'uppercase' }}>
            Language:
          </Typography>
          <Chip
            size="small"
            color={lang === 'en' ? 'primary' : 'default'}
            variant={lang === 'en' ? 'filled' : 'outlined'}
            label="English"
            onClick={() => {
              setLang('en');
              if (isPlaying) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
              }
            }}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            size="small"
            color={lang === 'hi' ? 'primary' : 'default'}
            variant={lang === 'hi' ? 'filled' : 'outlined'}
            label="हिन्दी (Hindi)"
            onClick={() => {
              setLang('hi');
              if (isPlaying) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
              }
            }}
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant={isPlaying ? 'contained' : 'outlined'}
            color={isPlaying ? 'secondary' : 'primary'}
            size="small"
            startIcon={isPlaying ? <VolumeOffIcon /> : <VolumeUpIcon />}
            onClick={handleAudioToggle}
            sx={{ borderRadius: 999, fontWeight: 600, px: 2.5 }}
          >
            {isPlaying ? 'Stop Audio Feed' : 'Listen to Briefing (TTS)'}
          </Button>

          {isPlaying && (
            <Stack direction="row" spacing={0.4} sx={{ height: 20, alignItems: 'flex-end', px: 1 }}>
              <Box sx={{ width: 3, bgcolor: 'secondary.main', borderRadius: 1, animation: 'wave 0.8s ease-in-out infinite alternate', '@keyframes wave': { '0%': { height: 4 }, '100%': { height: 18 } } }} />
              <Box sx={{ width: 3, bgcolor: 'secondary.main', borderRadius: 1, animation: 'wave 0.8s ease-in-out infinite alternate 0.2s', '@keyframes wave': { '0%': { height: 4 }, '100%': { height: 18 } } }} />
              <Box sx={{ width: 3, bgcolor: 'secondary.main', borderRadius: 1, animation: 'wave 0.8s ease-in-out infinite alternate 0.4s', '@keyframes wave': { '0%': { height: 4 }, '100%': { height: 18 } } }} />
              <Box sx={{ width: 3, bgcolor: 'secondary.main', borderRadius: 1, animation: 'wave 0.8s ease-in-out infinite alternate 0.1s', '@keyframes wave': { '0%': { height: 4 }, '100%': { height: 18 } } }} />
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Newspaper Editorial Layout */}
      <Stack spacing={3}>
        {briefing.sections.map((section, idx) => (
          <Card
            key={section.heading}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              bgcolor: 'background.paper',
              borderLeft: idx === 0 ? '4px solid' : '1px solid',
              borderLeftColor: idx === 0 ? 'primary.main' : 'divider',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: idx === 0 ? alpha(theme.palette.primary.main, 0.12) : 'action.hover',
                  color: idx === 0 ? 'primary.main' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {idx + 1}
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: 18, md: 20 }, color: 'text.primary' }}>
                {section.heading}
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2.5}>
              {section.items.map((item, itemIdx) => (
                <Box
                  key={item.text}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                    <Typography variant="body1" sx={{ flex: 1, lineHeight: 1.7, color: 'text.primary', fontWeight: 500 }}>
                      {item.text}
                    </Typography>

                    <Button
                      component={Link}
                      href={item.link}
                      size="small"
                      variant="outlined"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      sx={{ flexShrink: 0, fontWeight: 600, borderRadius: 999, alignSelf: { xs: 'flex-end', sm: 'center' } }}
                    >
                      {lang === 'en' ? 'Open Action' : 'खोलें'}
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
