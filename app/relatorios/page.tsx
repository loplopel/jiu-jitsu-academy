'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { exportCSV, exportPDF, exportExcel } from '@/lib/export';
import { FileDown, Table2, FileSpreadsheet } from 'lucide-react';

type ReportConfig = {
  table: string;
  select: string;
};

const configs: Record<string, ReportConfig> = {
  Presenca: {
    table: 'attendance',
    select: 'checked_in_at,class_id,student_id,ip_address,device_info',
  },
  Graduacao: {
    table: 'graduations',
    select: '*',
  },
  Professores: {
    table: 'profiles',
    select: '*',
  },
  Alunos: {
    table: 'students',
    select: '*',
  },
  Evolucao: {
    table: 'athlete_evolution',
    select: '*',
  },
};

const labels: Record<string, string> = {
  Presenca: 'Presen\u00e7a',
  Graduacao: 'Gradua\u00e7\u00e3o',
  Professores: 'Professores',
  Alunos: 'Alunos',
  Evolucao: 'Evolu\u00e7\u00e3o',
};

export default function Page() {
  const [type, setType] = useState('Presenca');
  const [msg, setMsg] = useState('');

  async function load() {
    setMsg('');

    const config = configs[type];

    const { getSupabaseBrowserClient } = await import(
      '@/lib/supabase-browser'
    );

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMsg('Supabase nao configurado.');
      return [];
    }

    const { data, error } = await supabase
      .from(config.table)
      .select(config.select);

    if (error) {
      setMsg(error.message);
      return [];
    }

    return (data || []) as unknown as Record<string, unknown>[];
  }

  async function generate(kind: 'pdf' | 'csv' | 'xlsx') {
    const rows = await load();

    if (!rows.length) {
      setMsg('Nenhum dado encontrado para este relatorio.');
      return;
    }

    const label = labels[type] || type;
    const filename = `relatorio-${type.toLowerCase()}`;

    if (kind === 'pdf') {
      exportPDF(rows, filename);
    }

    if (kind === 'csv') {
      exportCSV(rows, filename);
    }

    if (kind === 'xlsx') {
      exportExcel(rows, filename);
    }

    setMsg('Relatorio gerado com sucesso.');
  }

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>Relat{'\u00f3'}rios</h1>
          <p>
            Presen{'\u00e7'}a, gradua{'\u00e7\u00e3'}o, professores,
            alunos e evolu{'\u00e7\u00e3'}o esportiva.
          </p>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <select
            className="input"
            style={{ maxWidth: 260 }}
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {Object.keys(configs).map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={() => generate('pdf')}
          >
            <FileDown size={18} />
            PDF
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => generate('xlsx')}
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => generate('csv')}
          >
            <Table2 size={18} />
            CSV
          </button>
        </div>

        {msg && (
          <p style={{ marginTop: 16 }}>
            {msg}
          </p>
        )}
      </div>
    </AppShell>
  );
}

