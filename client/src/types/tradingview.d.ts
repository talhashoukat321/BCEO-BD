declare global {
  interface Window {
    TradingView: {
      widget: new (config: {
        autosize?: boolean;
        symbol: string;
        interval: string;
        theme?: string;
        style?: string;
        locale?: string;
        toolbar_bg?: string;
        enable_publishing?: boolean;
        hide_side_toolbar?: boolean;
        container_id: string;
      }) => void;
    };
  }
}

export {};