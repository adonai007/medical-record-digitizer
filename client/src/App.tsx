import { Route, Switch } from "wouter";
import Navigation from "./components/Navigation";
import HomePage from "./pages/home";
import UploadPage from "./pages/upload";
import RecordsPage from "./pages/records";
import RecordDetailPage from "./pages/record-detail";
import PatientsPage from "./pages/patients";
import PatientDetailPage from "./pages/patient-detail";
import PatientFormPage from "./pages/patient-form";
import SettingsPage from "./pages/settings";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/patients" component={PatientsPage} />
          <Route path="/patients/new" component={PatientFormPage} />
          <Route path="/patients/:id/edit" component={PatientFormPage} />
          <Route path="/patients/:id" component={PatientDetailPage} />
          <Route path="/upload" component={UploadPage} />
          <Route path="/records" component={RecordsPage} />
          <Route path="/records/:id" component={RecordDetailPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route>
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold">404 - Pagina no encontrada</h1>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
