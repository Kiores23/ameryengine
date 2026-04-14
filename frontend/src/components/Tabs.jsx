import {
  TAB_VIEWPORT,
  TAB_MEDIA,
  TAB_DEMO,
  TAB_CONTACT,
} from "../constants/appConstants";

export default function Tabs({
  activeTab,
  onChangeTab,
  canOpenMedia = false,
  baseTab = TAB_VIEWPORT,
  viewportDisabled = false,
}) {
  const tabs = [
    { id: TAB_VIEWPORT, label: "Viewport", toggle: false, disabled: viewportDisabled },
    { id: TAB_MEDIA, label: "Media", toggle: true, disabled: !canOpenMedia },
    { id: TAB_DEMO, label: "Demo", toggle: true, disabled: true },
    { id: TAB_CONTACT, label: "Contact", toggle: true, disabled: false },
  ];

  const handleClick = (tab) => {
    if (tab.disabled) return;

    if (!tab.toggle) {
      onChangeTab(tab.id);
      return;
    }

    onChangeTab((current) =>
      current === tab.id ? baseTab : tab.id
    );
  };

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={
            "btn btn--ghost tab" +
            (activeTab === tab.id ? " active" : "") +
            (tab.disabled ? " disabled" : "")
          }
          onClick={() => handleClick(tab)}
          title={
            tab.id === TAB_MEDIA && tab.disabled
              ? "Aucun media disponible pour cet objet"
              : tab.label
          }
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
