import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  PointOfSale,
  People,
  Inventory,
  Assessment,
  Category,
} from '@mui/icons-material';
import POS from './POS';
import Users from './Users';
import Products from './Products';
import Categories from './Categories';
import Reports from './Reports';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2, overflowX: 'auto' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="SuperAdmin tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: { xs: 48, sm: 64, md: 72 },
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              fontWeight: 600,
              px: { xs: 1, sm: 2, md: 3 },
            },
          }}
        >
          <Tab
            icon={<PointOfSale />}
            iconPosition="start"
            label="POS"
            id="admin-tab-0"
            aria-controls="admin-tabpanel-0"
          />
          <Tab
            icon={<People />}
            iconPosition="start"
            label="Users"
            id="admin-tab-1"
            aria-controls="admin-tabpanel-1"
          />
          <Tab
            icon={<Inventory />}
            iconPosition="start"
            label="Products"
            id="admin-tab-2"
            aria-controls="admin-tabpanel-2"
          />
          <Tab
            icon={<Category />}
            iconPosition="start"
            label="Categories"
            id="admin-tab-3"
            aria-controls="admin-tabpanel-3"
          />
          <Tab
            icon={<Assessment />}
            iconPosition="start"
            label="Reports"
            id="admin-tab-4"
            aria-controls="admin-tabpanel-4"
          />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <POS />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <Users />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <Products />
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        <Categories />
      </TabPanel>
      <TabPanel value={activeTab} index={4}>
        <Reports />
      </TabPanel>
    </Box>
  );
};

export default SuperAdminDashboard;

