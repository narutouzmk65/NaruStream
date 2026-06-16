export interface IPTVChannel {
  id: string;
  title: string;
  url: string;
  logo?: string;
  group?: string;
}

export function parseM3U(m3uContent: string): IPTVChannel[] {
  const channels: IPTVChannel[] = [];
  const lines = m3uContent.split('\n');
  
  let currentChannel: Partial<IPTVChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};
      
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      if (logoMatch && logoMatch[1]) {
        currentChannel.logo = logoMatch[1];
      }
      
      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]*)"/);
      if (groupMatch && groupMatch[1]) {
        currentChannel.group = groupMatch[1];
      } else {
        // Fallback to logo or group-title
        const tvgGroupMatch = line.match(/tvg-group="([^"]*)"/);
        if (tvgGroupMatch && tvgGroupMatch[1]) {
          currentChannel.group = tvgGroupMatch[1];
        }
      }

      // Extract title: it is after the last comma
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentChannel.title = line.substring(commaIndex + 1).trim();
      } else {
        currentChannel.title = 'Chaîne sans nom';
      }
    } else if (line && !line.startsWith('#')) {
      // This line is the URL
      if (line.startsWith('http://') || line.startsWith('https://')) {
        currentChannel.url = line;
        // Generate a random ID if not present
        currentChannel.id = Math.random().toString(36).substring(2, 11);
        
        if (currentChannel.title && currentChannel.url) {
          channels.push(currentChannel as IPTVChannel);
        }
      }
      currentChannel = {};
    }
  }

  return channels;
}
