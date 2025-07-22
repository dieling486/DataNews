import React from 'react';

const references = [
  { title: '人民日报：XXX主题相关报道', url: 'https://news.example.com/1' },
  { title: '国家统计局数据平台', url: 'https://data.stats.gov.cn/' },
  // ...更多参考资料
];

export default function ReferenceList() {
  return (
    <div>
      <h2 className="sectionTitle">参考资料</h2>
      <ul className="list">
        {references.map((ref, idx) => (
          <li key={idx} className="listItem">
            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="newsLink">
              {ref.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
} 