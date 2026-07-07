/**
 * S12 — Daily executive briefing (docs/08 §5). Text-first; Hindi + TTS audio arrive
 * with the live Executive Briefing Agent pipeline (docs/11 Sprint 9).
 */
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { briefing, district } from '@/lib/demo-data';

export default function BriefingsPage() {
  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2, maxWidth: 840 }}>
      <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
        <Typography variant="h3">Daily briefing</Typography>
        <Typography variant="body2" color="text.secondary">
          District {district.name} · {briefing.date} · {briefing.wordCount} words
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
        <Chip size="small" color="primary" label="English" />
        <Chip size="small" variant="outlined" label="हिन्दी — live pipeline" disabled />
        <Chip size="small" variant="outlined" label="▶ Audio (90 s) — live pipeline" disabled />
        <Chip size="small" variant="outlined" label="✦ Executive Briefing Agent" />
      </Stack>

      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5} divider={<Divider />}>
          {briefing.sections.map((section) => (
            <Box key={section.heading}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>{section.heading}</Typography>
              <Stack spacing={1}>
                {section.items.map((item) => (
                  <Stack key={item.text} direction="row" spacing={1} alignItems="baseline">
                    <Typography variant="body2" sx={{ flex: 1 }}>{item.text}</Typography>
                    <Chip
                      component={Link}
                      href={item.link}
                      clickable
                      size="small"
                      variant="outlined"
                      icon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      label="Open"
                    />
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}
